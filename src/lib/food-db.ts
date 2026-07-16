import { GEMINI_API_KEY } from './config';
import { useApp } from './store';

/**
 * Barcode → nutrition lookup with fallback chain:
 * 1. Open Food Facts (free, keyless, best coverage for EU/global products)
 * 2. USDA FoodData Central branded foods (DEMO_KEY, rate-limited but keyless)
 * 3. Gemini Search (Google Search grounding fallback using Gemini API key)
 * Singapore-local products are spotty in both — manual entry stays the backstop.
 */
export interface ProductInfo {
  name: string;
  source: string;
  per100g: { kcal: number; protein: number; carbs: number; fat: number; sodium: number };
}

async function fromOpenFoodFacts(code: string): Promise<ProductInfo | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,nutriments`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.product;
    const n = p?.nutriments;
    if (!n) return null;
    const kcal =
      typeof n['energy-kcal_100g'] === 'number'
        ? n['energy-kcal_100g']
        : typeof n['energy_100g'] === 'number'
          ? n['energy_100g'] / 4.184 // kJ → kcal
          : 0;
    if (!kcal) return null;
    return {
      name: p.product_name || 'Scanned product',
      source: 'Open Food Facts',
      per100g: {
        kcal: Math.round(kcal),
        protein: Math.round(n.proteins_100g ?? 0),
        carbs: Math.round(n.carbohydrates_100g ?? 0),
        fat: Math.round(n.fat_100g ?? 0),
        sodium: Math.round((n.sodium_100g ?? 0) * 1000), // g → mg
      },
    };
  } catch {
    return null;
  }
}

const FDC_IDS = { kcal: 1008, protein: 1003, carbs: 1005, fat: 1004, sodium: 1093 };

async function fromUsdaFdc(code: string): Promise<ProductInfo | null> {
  try {
    const res = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY&query=${encodeURIComponent(code)}&dataType=Branded&pageSize=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const food = data?.foods?.[0];
    if (!food?.foodNutrients || String(food.gtinUpc ?? '').replace(/^0+/, '') !== code.replace(/^0+/, '')) {
      return null;
    }
    const get = (id: number) =>
      food.foodNutrients.find((x: any) => x.nutrientId === id)?.value ?? 0;
    const kcal = get(FDC_IDS.kcal);
    if (!kcal) return null;
    return {
      name: food.description || 'Scanned product',
      source: 'USDA FDC',
      per100g: {
        kcal: Math.round(kcal),
        protein: Math.round(get(FDC_IDS.protein)),
        carbs: Math.round(get(FDC_IDS.carbs)),
        fat: Math.round(get(FDC_IDS.fat)),
        sodium: Math.round(get(FDC_IDS.sodium)), // already mg per 100g
      },
    };
  } catch {
    return null;
  }
}

async function fromGeminiSearch(code: string): Promise<ProductInfo | null> {
  const geminiKey = useApp.getState().apiKeys.gemini || GEMINI_API_KEY;
  if (!geminiKey) return null;

  const prompt = `Search the web for the nutritional facts of the product with barcode "${code}".
Retrieve its name and nutritional values per 100g (or the default serving size if per 100g is unavailable).
Respond ONLY with JSON matching this schema:
{"name": string, "kcal": number, "protein": number, "carbs": number, "fat": number, "sodium": number}
If you cannot find the product or its nutritional information via search, respond ONLY with: null`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    let cleanedText = text.trim();
    if (cleanedText.startsWith('```')) {
      const firstNewline = cleanedText.indexOf('\n');
      if (firstNewline !== -1) {
        cleanedText = cleanedText.substring(firstNewline).trim();
      }
      if (cleanedText.endsWith('```')) {
        cleanedText = cleanedText.substring(0, cleanedText.length - 3).trim();
      }
    }

    const parsed = JSON.parse(cleanedText);
    if (!parsed || !parsed.name || typeof parsed.kcal !== 'number') return null;
    return {
      name: parsed.name,
      source: 'Gemini Search',
      per100g: {
        kcal: Math.round(parsed.kcal),
        protein: Math.round(parsed.protein ?? 0),
        carbs: Math.round(parsed.carbs ?? 0),
        fat: Math.round(parsed.fat ?? 0),
        sodium: Math.round(parsed.sodium ?? 0),
      },
    };
  } catch {
    return null;
  }
}

export async function lookupBarcode(code: string): Promise<ProductInfo | null> {
  return (
    (await fromOpenFoodFacts(code)) ?? 
    (await fromUsdaFdc(code)) ?? 
    (await fromGeminiSearch(code))
  );
}

