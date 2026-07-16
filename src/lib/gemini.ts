import { GEMINI_API_KEY } from './config';
import { useApp } from './store';

/** user-provided key from settings wins over the baked-in dev key */
const geminiKey = () => useApp.getState().apiKeys.gemini || GEMINI_API_KEY;

export const geminiConfigured = () => geminiKey().length > 0;

export interface FoodItem {
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
  source?: string;
  sourceUrl?: string;
}

export interface FoodAnalysis {
  items: FoodItem[];
  desc: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium: number;
}

const PROMPT = `You are a nutrition analyst. Identify the food and estimate a macro breakdown. For multi-ingredient meals or plates with multiple distinct items, ALWAYS split them and list the individual components separately in the "items" array.

Follow this strict order of priority for determining the nutritional values of each item, and specify the source and its link:
1. NUTRITION FACTS LABEL IN PHOTO: If a visible "Nutrition Facts" label (or ingredients/macros table) is on the packaging in the photo, extract values directly from it. Do NOT use search for this item. Set "source" to "Nutrition Label" and "sourceUrl" to null.
2. GOOGLE SEARCH FOR PACKAGED/BRANDED/RESTAURANT FOOD: If no label is visible and it is a packaged, branded, or restaurant item, search for the actual nutrition data.
   - IMPORTANT: Verify the exact brand name requested (e.g. "Freezepak") and do not use generic or incorrect products. Cross-reference multiple websites to find the most accurate product listing.
   - Set "source" to the short name of the website where you found the exact match (e.g. "NTUC FairPrice", "Open Food Facts", "Sheng Siong", "Brand Website").
   - Set "sourceUrl" to the direct URL/link of the product website or nutrition database page where you found the exact match. 
   - CRITICAL URL RULE: You MUST output the direct website URL (e.g. 'https://www.fairprice.com.sg/...'). DO NOT output Google/Vertex redirect links (such as 'vertexaisearch.cloud.google.com/grounding-api-redirect/...'). Look at the original source pages and extract their actual URLs.
3. ESTIMATION: If it is a whole food or home-cooked food (no brand/label/search results), estimate the values. Set "source" to "Estimated" and "sourceUrl" to null.

Use the photo if provided. The user's notes may correct portions or add items not visible in the photo — trust the notes over the photo when they conflict.
Respond ONLY with JSON matching this schema:
{"items":[{"name":string,"grams":number,"kcal":number,"protein":number,"carbs":number,"fat":number,"sodium":number,"source":string,"sourceUrl":string|null}]}
Numbers are your best realistic estimates or extractions (protein/carbs/fat/kcal total per item, sodium in mg).`;

/**
 * Analyze one or more meal photos and/or text notes with Gemini Flash.
 * Returns null on failure (network, quota, parse).
 */
export async function analyzeFood(
  imagesBase64: string[],
  notes: string
): Promise<FoodAnalysis | null> {
  if (!geminiConfigured()) return null;
  const parts: object[] = [{ text: PROMPT }];
  for (const img of imagesBase64) {
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: img } });
  }
  if (imagesBase64.length > 1) {
    parts.push({ text: `There are ${imagesBase64.length} photos of the same meal/sitting — combine them into one breakdown without double-counting items visible in multiple photos.` });
  }
  parts.push({ text: `User notes: ${notes.trim() || '(none)'}` });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // clean markdown code blocks if the model wrapped the JSON
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
    const items: FoodItem[] = (parsed.items ?? [])
      .filter((it: any) => it && typeof it.name === 'string')
      .map((it: any) => {
        let sourceUrl = it.sourceUrl ? String(it.sourceUrl) : undefined;
        // fallback programmatic cleanup if model still returns redirect link
        if (sourceUrl && sourceUrl.includes('grounding-api-redirect')) {
          try {
            // Try to extract url query param if present
            const match = sourceUrl.match(/[?&]url=([^&]+)/);
            if (match && match[1]) {
              sourceUrl = decodeURIComponent(match[1]);
            }
          } catch {}
        }
        return {
          name: String(it.name),
          grams: Math.round(Number(it.grams) || 0),
          kcal: Math.round(Number(it.kcal) || 0),
          protein: Math.round(Number(it.protein) || 0),
          carbs: Math.round(Number(it.carbs) || 0),
          fat: Math.round(Number(it.fat) || 0),
          sodium: Math.round(Number(it.sodium) || 0),
          source: it.source ? String(it.source) : 'Estimated',
          sourceUrl: sourceUrl || undefined,
        };
      });
    if (items.length === 0) return null;
    const sum = (k: keyof FoodItem) => items.reduce((a, it) => a + (it[k] as number || 0), 0);
    return {
      items,
      desc: items.map((it) => it.name).join(', '),
      kcal: sum('kcal'),
      protein: sum('protein'),
      carbs: sum('carbs'),
      fat: sum('fat'),
      sodium: sum('sodium'),
    };
  } catch {
    return null;
  }
}
