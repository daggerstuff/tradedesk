import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { serverError, unauthorized } from '@/lib/api-errors';

// Import customers or expenses from QuickBooks
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = await req.json();
  const type: string = body.type || 'customers';

  const users = await query(
    'SELECT qb_access_token, qb_realm_id FROM users WHERE id = $1',
    [session.userId]
  );
  const user = users[0] as { qb_access_token: string; qb_realm_id: string } | undefined;

  if (!user?.qb_access_token) {
    return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 400 });
  }

  try {
    if (type === 'expenses') {
      const qbPurchases = await fetchQB(
        user.qb_access_token,
        user.qb_realm_id,
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
      user.qb_access_token,
      user.qb_realm_id,
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
