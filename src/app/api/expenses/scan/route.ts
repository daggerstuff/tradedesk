import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createWorker } from 'tesseract.js';
import { categorizeExpense, extractAmount, extractVendor, extractDate, extractDescription } from '@/lib/expense-categorization';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('receipt') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No receipt file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run OCR
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    // Extract structured data using improved categorization
    const amount = extractAmount(text);
    const vendor = extractVendor(text);
    const date = extractDate(text) || new Date().toISOString().split('T')[0];
    const categorization = categorizeExpense(text, vendor || '', session);
    const category = categorization.category;
    const description = extractDescription(text);

    return NextResponse.json({
      extracted: {
        vendor,
        amount,
        date,
        category,
        description,
        rawText: text,
        confidence: categorization.confidence,
        matchedKeywords: categorization.keywords
      }
    });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'Failed to process receipt' }, { status: 500 });
  }
}