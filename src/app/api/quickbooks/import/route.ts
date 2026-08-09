import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { serverError, unauthorized } from '@/lib/api-errors';
// eslint-disable-next-line @typescript-eslint/no-explicit-any

// Import customers from QuickBooks
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const users = await query<{ qb_access_token: string; qb_realm_id: string }>(
    'SELECT qb_access_token, qb_realm_id FROM users WHERE id = $1',
    [session.userId]
  );
  const user = users[0];

  if (!user?.qb_access_token) {
    return NextResponse.json({ error: 'QuickBooks not connected' }, { status: 400 });
  }

  try {
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

function formatAddr(addr: Record<string, string | undefined>): string {
  return [addr.Line1, addr.City, addr.CountrySubDivisionCode, addr.PostalCode]
    .filter(Boolean)
    .join(', ');
}
