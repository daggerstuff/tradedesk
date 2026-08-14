import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { serverError, unauthorized } from '@/lib/api-errors';
import { refreshQBToken } from '@/lib/quickbooks';

async function getValidToken(userId: string): Promise<{ access_token: string; realm_id: string }> {
  const rows = await query(
    'SELECT qb_access_token, qb_refresh_token, qb_realm_id, qb_token_expires_at FROM users WHERE id = $1',
    [userId]
  );
  const user = rows[0] as {
    qb_access_token: string;
    qb_refresh_token: string;
    qb_realm_id: string;
    qb_token_expires_at: string;
  } | undefined;

  if (!user?.qb_access_token) {
    throw new Error('QuickBooks not connected');
  }

  // Refresh if expiring in next 5 minutes
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

// Import customers or expenses from QuickBooks
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const type: string = body.type || 'customers';

  try {
    const { access_token, realm_id } = await getValidToken(session.userId);

    if (type === 'expenses') {
      const qbPurchases = await fetchQB(
        access_token,
        realm_id,
        'SELECT * FROM Purchase WHERE TxnDate >= \'2025-01-01\''
      );

      let imported = 0;
      const errors: string[] = [];
      for (const p of qbPurchases.QueryResponse?.Purchase || []) {
        try {
          const accountName = p.AccountRef?.name || 'Expense';
          const totalAmt = p.TotalAmt || 0;
          const txnDate = p.TxnDate || new Date().toISOString().split('T')[0];
          const memo = p.PrivateNote || p.DocNumber || '';
          const vendorName = p.VendorRef?.name || '';

          await query(
            `INSERT INTO expenses (id, user_id, category, vendor, amount, date, description, job_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            [
              `qb_${p.Id}`,
              session.userId,
              accountName,
              vendorName,
              totalAmt,
              txnDate,
              memo,
            ]
          );
          imported++;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'unknown';
          errors.push(`Purchase ${p.Id}: ${msg}`);
        }
      }

      return NextResponse.json({ imported, errors });
    }

    // Default: import customers
    const qbCustomers = await fetchQB(
      access_token,
      realm_id,
      'SELECT * FROM Customer'
    );

    let imported = 0;
    for (const c of qbCustomers.QueryResponse?.Customer || []) {
      await query(
        `INSERT INTO customers (id, user_id, name, email, phone, company_name, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [
          `qb_${c.Id}`,
          session.userId,
          c.DisplayName || c.CompanyName || '',
          c.PrimaryEmailAddr?.Address || '',
          c.PrimaryPhone?.FreeFormNumber || '',
          c.CompanyName || '',
          c.BillAddr ? formatAddr(c.BillAddr) : '',
        ]
      );
      imported++;
    }

    return NextResponse.json({ imported });
  } catch {
    return serverError('Failed to import from QuickBooks');
  }
}

async function fetchQB(accessToken: string, realmId: string, queryStr: string) {
  const url = `https://quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(queryStr)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('QB API error');
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAddr(addr: Record<string, string | undefined>): string {
  return [addr.Line1, addr.City, addr.CountrySubDivisionCode, addr.PostalCode]
    .filter(Boolean)
    .join(', ');
}
