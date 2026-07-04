/**
 * Barcode → nutrition lookup with fallback chain:
 * 1. Open Food Facts (free, keyless, best coverage for EU/global products)
 * 2. USDA FoodData Central branded foods (DEMO_KEY, rate-limited but keyless)
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

export async function lookupBarcode(code: string): Promise<ProductInfo | null> {
  return (await fromOpenFoodFacts(code)) ?? (await fromUsdaFdc(code));
}
