import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { recordCorrection } from '@/lib/expense-categorization';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { text, vendor, predictedCategory, actualCategory } = await req.json();
    
    if (!text || !vendor || !predictedCategory || !actualCategory) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    recordCorrection(text, vendor, predictedCategory, actualCategory, session);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Categorization feedback error:', error);
    return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
  }
}