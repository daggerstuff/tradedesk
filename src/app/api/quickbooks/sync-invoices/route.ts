import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { serverError, unauthorized } from '@/lib/api-errors';
import { refreshQBToken } from '@/lib/quickbooks';

interface QBTokenRow {
  qb_access_token: string;
  qb_refresh_token: string;
  qb_realm_id: string;
  qb_token_expires_at: string | null;
}

interface InvoiceRow {
  id: string;
  invoice_number: string;
  issue_date: string | null;
  due_date: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_id: string | null;
  qb_customer_id: string | null;
}

interface InvoiceItemRow {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

async function getValidToken(userId: string): Promise<{ access_token: string; realm_id: string }> {
  const rows = await query(
    'SELECT qb_access_token, qb_refresh_token, qb_realm_id, qb_token_expires_at FROM users WHERE id = $1',
    [userId]
  );
  const user = rows[0] as unknown as QBTokenRow | undefined;

  if (!user?.qb_access_token) throw new Error('QuickBooks not connected');

  const expiresAt = user.qb_token_expires_at ? new Date(user.qb_token_expires_at).getTime() : 0;
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    const tokens = await refreshQBToken(user.qb_refresh_token);
    const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await query(
      'UPDATE users SET qb_access_token = $1, qb_refresh_token = $2, qb_token_expires_at = $3 WHERE id = $4',
      [tokens.access_token, tokens.refresh_token, newExpiresAt, userId]
    );
    return { access_token: tokens.access_token, realm_id: user.qb_realm_id };
  }

  return { access_token: user.qb_access_token, realm_id: user.qb_realm_id };
}

async function fetchQB(accessToken: string, realmId: string, path: string, method = 'GET', body?: object) {
  const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`QB API error: ${res.status}`);
  return res.json();
}

// Sync TradeDesk invoices to QuickBooks
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const invoiceId: string | undefined = body.invoiceId;

  try {
    const { access_token, realm_id } = await getValidToken(session.userId);

    // Get invoices to sync
    const invoiceRows: InvoiceRow[] = invoiceId
      ? (await query(
          `SELECT i.id, i.invoice_number, i.issue_date, i.due_date,
                  c.name as customer_name, c.email as customer_email,
                  c.qb_customer_id, c.id as customer_id
           FROM invoices i
           LEFT JOIN customers c ON c.id = i.customer_id
           WHERE i.id = $1 AND i.user_id = $2`,
          [invoiceId, session.userId]
        )) as unknown as InvoiceRow[]
      : (await query(
          `SELECT i.id, i.invoice_number, i.issue_date, i.due_date,
                  c.name as customer_name, c.email as customer_email,
                  c.qb_customer_id, c.id as customer_id
           FROM invoices i
           LEFT JOIN customers c ON c.id = i.customer_id
           WHERE i.user_id = $1 AND i.qb_invoice_id IS NULL
           LIMIT 10`,
          [session.userId]
        )) as unknown as InvoiceRow[];

    if (!invoiceRows.length) {
      return NextResponse.json({ synced: 0, message: 'No invoices to sync' });
    }

    let synced = 0;
    const results: { invoiceId: string; qbId?: string; error?: string }[] = [];

    for (const inv of invoiceRows) {
      try {
        let qbCustomerId = inv.qb_customer_id;

        if (!qbCustomerId && inv.customer_email) {
          const search = await fetchQB(
            access_token,
            realm_id,
            `/query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE PrimaryEmailAddr = '${inv.customer_email}'`)}`
          );
          qbCustomerId = (search.QueryResponse as { Customer?: { Id: string }[] })?.Customer?.[0]?.Id ?? null;
        }

        if (!qbCustomerId && inv.customer_name) {
          const newCustomer = await fetchQB(
            access_token,
            realm_id,
            '/customer',
            'POST',
            {
              DisplayName: inv.customer_name,
              ...(inv.customer_email ? { PrimaryEmailAddr: { Address: inv.customer_email } } : {}),
            }
          );
          qbCustomerId = (newCustomer as { Customer: { Id: string } }).Customer.Id;
          if (inv.customer_id) {
            await query('UPDATE customers SET qb_customer_id = $1 WHERE id = $2', [qbCustomerId, inv.customer_id]);
          }
        }

        if (!qbCustomerId) {
          results.push({ invoiceId: inv.id, error: 'No customer mapping' });
          continue;
        }

        const itemRows = (await query(
          'SELECT description, quantity, unit_price, total FROM invoice_items WHERE invoice_id = $1',
          [inv.id]
        )) as unknown as InvoiceItemRow[];

        const qbInvoice = await fetchQB(
          access_token,
          realm_id,
          '/invoice',
          'POST',
          {
            CustomerRef: { value: qbCustomerId },
            DocNumber: inv.invoice_number,
            TxnDate: inv.issue_date,
            DueDate: inv.due_date,
            Line: itemRows.map((item) => ({
              DetailType: 'SalesItemLineDetail',
              Amount: item.total,
              Description: item.description,
              SalesItemLineDetail: {
                Qty: item.quantity,
                UnitPrice: item.unit_price,
              },
            })),
          }
        );

        await query('UPDATE invoices SET qb_invoice_id = $1 WHERE id = $2', [(qbInvoice as { Invoice: { Id: string } }).Invoice.Id, inv.id]);

        synced++;
        results.push({ invoiceId: inv.id, qbId: (qbInvoice as { Invoice: { Id: string } }).Invoice.Id });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'unknown';
        results.push({ invoiceId: inv.id, error: msg });
      }
    }

    return NextResponse.json({ synced, results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return serverError(msg);
  }
}

// Check sync status of invoices
export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const rows = await query(
    `SELECT COUNT(*) FILTER (WHERE qb_invoice_id IS NOT NULL) as synced,
            COUNT(*) FILTER (WHERE qb_invoice_id IS NULL) as pending
     FROM invoices WHERE user_id = $1`,
    [session.userId]
  );

  const row = rows[0] as { synced: string; pending: string };
  return NextResponse.json({
    synced: parseInt(row.synced, 10),
    pending: parseInt(row.pending, 10),
  });
}
