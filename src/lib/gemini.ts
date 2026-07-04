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

const PROMPT = `You are a nutrition analyst. Identify the food and estimate a macro breakdown.
Use the photo if provided. The user's notes may correct portions or add items not visible in the photo — trust the notes over the photo when they conflict.
Respond ONLY with JSON matching this schema:
{"items":[{"name":string,"grams":number,"kcal":number,"protein":number,"carbs":number,"fat":number,"sodium":number}]}
Numbers are your best realistic estimates for the described portions (grams of protein/carbs/fat, kcal total per item, sodium in mg).`;

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
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    const parsed = JSON.parse(text);
    const items: FoodItem[] = (parsed.items ?? [])
      .filter((it: any) => it && typeof it.name === 'string')
      .map((it: any) => ({
        name: String(it.name),
        grams: Math.round(Number(it.grams) || 0),
        kcal: Math.round(Number(it.kcal) || 0),
        protein: Math.round(Number(it.protein) || 0),
        carbs: Math.round(Number(it.carbs) || 0),
        fat: Math.round(Number(it.fat) || 0),
        sodium: Math.round(Number(it.sodium) || 0),
      }));
    if (items.length === 0) return null;
    const sum = (k: keyof FoodItem) => items.reduce((a, it) => a + (it[k] as number), 0);
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
