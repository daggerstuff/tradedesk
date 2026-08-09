import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query(
    `SELECT id, email, name, company, company_address, company_city, company_state, company_zip, company_country, tax_id, logo_url, phone
     FROM users WHERE id = $1`,
    [session.userId]
  );

  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user: rows[0] });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, company, companyAddress, companyCity, companyState, companyZip, companyCountry, taxId, logoUrl, phone, skipOnboarding } = body;

  await query(
    `UPDATE users SET
       name = COALESCE($2, name),
       company = COALESCE($3, company),
       company_address = COALESCE($4, company_address),
       company_city = COALESCE($5, company_city),
       company_state = COALESCE($6, company_state),
       company_zip = COALESCE($7, company_zip),
       company_country = COALESCE($8, company_country),
       tax_id = COALESCE($9, tax_id),
       logo_url = COALESCE($10, logo_url),
       phone = COALESCE($11, phone),
       onboarding_completed = true
     WHERE id = $1`,
    [session.userId, name, company, companyAddress, companyCity, companyState, companyZip, companyCountry || 'US', taxId, logoUrl, phone]
  );

  return NextResponse.json({ success: true });
}
