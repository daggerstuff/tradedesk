// Expense Categorization Service
// Uses keyword-based matching with learned corrections from user feedback

export interface CategoryMatch {
  category: string;
  confidence: number;
  keywords: string[];
}

export interface TrainingSample {
  text: string;
  vendor: string;
  category: string;
  amount?: number;
  date?: string;
}

// Default categories matching the database schema
export const EXPENSE_CATEGORIES = [
  'materials',
  'labor', 
  'travel',
  'equipment',
  'software',
  'rent',
  'utilities',
  'marketing',
  'other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// Keyword-based categorization with weights
const CATEGORY_KEYWORDS: Record<ExpenseCategory, { keyword: string; weight: number }[]> = {
  materials: [
    { keyword: 'lumber', weight: 1.0 },
    { keyword: 'pipe', weight: 1.0 },
    { keyword: 'wire', weight: 1.0 },
    { keyword: 'cement', weight: 1.0 },
    { keyword: 'paint', weight: 1.0 },
    { keyword: 'tile', weight: 1.0 },
    { keyword: 'drywall', weight: 1.0 },
    { keyword: 'insulation', weight: 1.0 },
    { keyword: 'roofing', weight: 1.0 },
    { keyword: 'siding', weight: 1.0 },
    { keyword: 'flooring', weight: 1.0 },
    { keyword: 'hardware', weight: 0.8 },
    { keyword: 'fastener', weight: 0.8 },
    { keyword: 'screw', weight: 0.7 },
    { keyword: 'nail', weight: 0.7 },
    { keyword: 'bolt', weight: 0.7 },
    { keyword: 'bracket', weight: 0.7 },
    { keyword: 'hinge', weight: 0.7 },
    { keyword: 'handle', weight: 0.7 },
    { keyword: 'knob', weight: 0.7 },
    { keyword: 'faucet', weight: 0.9 },
    { keyword: 'valve', weight: 0.9 },
    { keyword: 'pump', weight: 0.9 },
    { keyword: 'filter', weight: 0.8 },
    { keyword: 'sealant', weight: 0.8 },
    { keyword: 'adhesive', weight: 0.8 },
    { keyword: 'glue', weight: 0.7 },
    { keyword: 'tape', weight: 0.6 },
    { keyword: 'caulk', weight: 0.9 },
    { keyword: 'grout', weight: 0.9 },
    { keyword: 'mortar', weight: 0.9 },
    { keyword: 'plaster', weight: 0.9 },
    { keyword: 'primer', weight: 0.8 },
    { keyword: 'stain', weight: 0.8 },
    { keyword: 'varnish', weight: 0.8 },
    { keyword: 'lacquer', weight: 0.8 },
    { keyword: 'thinner', weight: 0.7 },
    { keyword: 'solvent', weight: 0.7 },
    { keyword: 'cleaner', weight: 0.5 },
    { keyword: 'degreaser', weight: 0.6 },
    { keyword: 'lubricant', weight: 0.6 },
    { keyword: 'oil', weight: 0.5 },
    { keyword: 'grease', weight: 0.5 },
    { keyword: 'fuel', weight: 0.3 },
    { keyword: 'gas', weight: 0.3 },
    { keyword: 'propane', weight: 0.4 },
    { keyword: 'diesel', weight: 0.3 },
    { keyword: 'kerosene', weight: 0.3 },
  ],
  labor: [
    { keyword: 'labor', weight: 1.0 },
    { keyword: 'wages', weight: 1.0 },
    { keyword: 'payroll', weight: 1.0 },
    { keyword: 'contractor', weight: 0.9 },
    { keyword: 'subcontractor', weight: 0.9 },
    { keyword: 'helper', weight: 0.8 },
    { keyword: 'apprentice', weight: 0.8 },
    { keyword: 'journeyman', weight: 0.9 },
    { keyword: 'foreman', weight: 0.9 },
    { keyword: 'supervisor', weight: 0.8 },
    { keyword: 'overtime', weight: 0.9 },
    { keyword: 'benefits', weight: 0.7 },
    { keyword: 'insurance', weight: 0.5 },
    { keyword: 'workers comp', weight: 1.0 },
    { keyword: 'tax', weight: 0.4 },
    { keyword: 'withholding', weight: 0.6 },
  ],
  travel: [
    { keyword: 'gas', weight: 0.8 },
    { keyword: 'fuel', weight: 0.8 },
    { keyword: 'mileage', weight: 1.0 },
    { keyword: 'parking', weight: 0.9 },
    { keyword: 'toll', weight: 0.9 },
    { keyword: 'hotel', weight: 0.9 },
    { keyword: 'motel', weight: 0.9 },
    { keyword: 'lodging', weight: 0.9 },
    { keyword: 'meal', weight: 0.7 },
    { keyword: 'restaurant', weight: 0.6 },
    { keyword: 'per diem', weight: 1.0 },
    { keyword: 'airfare', weight: 1.0 },
    { keyword: 'flight', weight: 1.0 },
    { keyword: 'rental', weight: 0.6 },
    { keyword: 'uber', weight: 0.9 },
    { keyword: 'lyft', weight: 0.9 },
    { keyword: 'taxi', weight: 0.9 },
    { keyword: 'transit', weight: 0.8 },
    { keyword: 'bus', weight: 0.8 },
    { keyword: 'train', weight: 0.8 },
  ],
  equipment: [
    { keyword: 'tool', weight: 0.7 },
    { keyword: 'drill', weight: 0.9 },
    { keyword: 'saw', weight: 0.9 },
    { keyword: 'hammer', weight: 0.7 },
    { keyword: 'wrench', weight: 0.8 },
    { keyword: 'level', weight: 0.8 },
    { keyword: 'square', weight: 0.8 },
    { keyword: 'tape measure', weight: 0.8 },
    { keyword: 'ladder', weight: 0.9 },
    { keyword: 'scaffold', weight: 0.9 },
    { keyword: 'lift', weight: 0.9 },
    { keyword: 'generator', weight: 0.9 },
    { keyword: 'compressor', weight: 0.9 },
    { keyword: 'welder', weight: 0.9 },
    { keyword: 'cutter', weight: 0.8 },
    { keyword: 'grinder', weight: 0.8 },
    { keyword: 'sander', weight: 0.8 },
    { keyword: 'polisher', weight: 0.8 },
    { keyword: 'vacuum', weight: 0.6 },
    { keyword: 'blower', weight: 0.6 },
    { keyword: 'pressure washer', weight: 0.9 },
    { keyword: 'rental', weight: 0.5 },
    { keyword: 'lease', weight: 0.5 },
    { keyword: 'maintenance', weight: 0.6 },
    { keyword: 'repair', weight: 0.6 },
    { keyword: 'service', weight: 0.5 },
    { keyword: 'calibration', weight: 0.8 },
    { keyword: 'inspection', weight: 0.6 },
    { keyword: 'certification', weight: 0.6 },
  ],
  software: [
    { keyword: 'software', weight: 1.0 },
    { keyword: 'app', weight: 0.7 },
    { keyword: 'subscription', weight: 0.9 },
    { keyword: 'license', weight: 1.0 },
    { keyword: 'saas', weight: 1.0 },
    { keyword: 'cloud', weight: 0.8 },
    { keyword: 'api', weight: 0.8 },
    { keyword: 'platform', weight: 0.7 },
    { keyword: 'crm', weight: 1.0 },
    { keyword: 'erp', weight: 1.0 },
    { keyword: 'accounting', weight: 0.9 },
    { keyword: 'quickbooks', weight: 1.0 },
    { keyword: 'xero', weight: 1.0 },
    { keyword: 'freshbooks', weight: 1.0 },
    { keyword: 'project management', weight: 0.9 },
    { keyword: 'estimating', weight: 0.9 },
    { keyword: 'bidding', weight: 0.8 },
    { keyword: 'scheduling', weight: 0.8 },
    { keyword: 'dispatch', weight: 0.8 },
    { keyword: 'gps', weight: 0.7 },
    { keyword: 'tracking', weight: 0.7 },
    { keyword: 'mobile', weight: 0.5 },
    { keyword: 'tablet', weight: 0.5 },
    { keyword: 'phone', weight: 0.4 },
  ],
  rent: [
    { keyword: 'rent', weight: 1.0 },
    { keyword: 'lease', weight: 1.0 },
    { keyword: 'mortgage', weight: 1.0 },
    { keyword: 'property tax', weight: 1.0 },
    { keyword: 'hoa', weight: 0.9 },
    { keyword: 'storage', weight: 0.8 },
    { keyword: 'warehouse', weight: 0.9 },
    { keyword: 'shop', weight: 0.8 },
    { keyword: 'garage', weight: 0.8 },
    { keyword: 'yard', weight: 0.6 },
    { keyword: 'office', weight: 0.8 },
  ],
  utilities: [
    { keyword: 'electric', weight: 1.0 },
    { keyword: 'electricity', weight: 1.0 },
    { keyword: 'power', weight: 0.8 },
    { keyword: 'gas', weight: 0.6 },
    { keyword: 'water', weight: 1.0 },
    { keyword: 'sewer', weight: 1.0 },
    { keyword: 'trash', weight: 0.9 },
    { keyword: 'garbage', weight: 0.9 },
    { keyword: 'internet', weight: 1.0 },
    { keyword: 'phone', weight: 0.7 },
    { keyword: 'cable', weight: 0.8 },
    { keyword: 'wifi', weight: 0.9 },
    { keyword: 'broadband', weight: 0.9 },
  ],
  marketing: [
    { keyword: 'advertising', weight: 1.0 },
    { keyword: 'ads', weight: 0.9 },
    { keyword: 'google ads', weight: 1.0 },
    { keyword: 'facebook ads', weight: 1.0 },
    { keyword: 'instagram', weight: 0.7 },
    { keyword: 'website', weight: 0.8 },
    { keyword: 'seo', weight: 1.0 },
    { keyword: 'marketing', weight: 1.0 },
    { keyword: 'promotion', weight: 0.8 },
    { keyword: 'flyer', weight: 0.8 },
    { keyword: 'business card', weight: 0.9 },
    { keyword: 'signage', weight: 0.9 },
    { keyword: 'vehicle wrap', weight: 1.0 },
    { keyword: 'logo', weight: 0.8 },
    { keyword: 'branding', weight: 0.9 },
    { keyword: 'lead', weight: 0.6 },
    { keyword: 'referral', weight: 0.7 },
    { keyword: 'networking', weight: 0.6 },
  ],
  other: [],
};

// In-memory storage for user corrections (would use database in production)
const userCorrections: Map<string, TrainingSample[]> = new Map();

function getUserKey(session: any): string {
  return session?.user?.id || 'anonymous';
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ');
}

export function categorizeExpense(text: string, vendor: string, session?: any): CategoryMatch {
  const combined = normalizeText(text + ' ' + vendor);
  const words = combined.split(/\s+/);
  
  const scores: Record<string, number> = {};
  const matchedKeywords: Record<string, string[]> = {};
  
  // Initialize scores
  for (const cat of EXPENSE_CATEGORIES) {
    scores[cat] = 0;
    matchedKeywords[cat] = [];
  }
  
  // Score based on keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const { keyword, weight } of keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        scores[category] += weight;
        if (!matchedKeywords[category].includes(keyword)) {
          matchedKeywords[category].push(keyword);
        }
      }
    }
  }
  
  // Apply user corrections as boost
  const userKey = getUserKey(session);
  const corrections = userCorrections.get(userKey) || [];
  for (const correction of corrections) {
    const correctionText = normalizeText(correction.text + ' ' + correction.vendor);
    const correctionWords = correctionText.split(/\s+/);
    const overlap = words.filter(w => correctionWords.includes(w)).length;
    if (overlap > 2) {
      scores[correction.category] += 2.0 * overlap;
    }
  }
  
  // Find best category
  let bestCategory: ExpenseCategory = 'other';
  let maxScore = 0;
  
  for (const cat of EXPENSE_CATEGORIES) {
    if (scores[cat] > maxScore) {
      maxScore = scores[cat];
      bestCategory = cat;
    }
  }
  
  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(maxScore / totalScore, 1) : 0;
  
  return {
    category: bestCategory,
    confidence,
    keywords: matchedKeywords[bestCategory]
  };
}

export function recordCorrection(
  text: string, 
  vendor: string, 
  predictedCategory: string, 
  actualCategory: string,
  session: any
): void {
  if (predictedCategory === actualCategory) return;
  
  const userKey = getUserKey(session);
  const corrections = userCorrections.get(userKey) || [];
  
  corrections.push({
    text,
    vendor,
    category: actualCategory,
  });
  
  // Keep only last 100 corrections per user
  if (corrections.length > 100) {
    corrections.shift();
  }
  
  userCorrections.set(userKey, corrections);
}

export function getUserCorrections(session: any): TrainingSample[] {
  const userKey = getUserKey(session);
  return userCorrections.get(userKey) || [];
}

export function extractAmount(text: string): number | null {
  const matches = text.match(/\$?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+\.\d{2})/g);
  if (!matches) return null;
  
  const amounts = matches.map(m => parseFloat(m.replace(/[$,]/g, '')));
  return Math.max(...amounts);
}

export function extractVendor(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Z][a-zA-Z\s&.'-]{2,}$/.test(line) && !/^\d+$/.test(line)) {
      return line;
    }
  }
  return null;
}

export function extractDate(text: string): string | null {
  const patterns = [
    /\b(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})\b/,
    /\b(\d{4}[/\-]\d{1,2}[/\-]\d{1,2})\b/,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  return null;
}

export function extractDescription(text: string): string {
  return text.slice(0, 500);
}