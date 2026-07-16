import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, Dim, H2, NumInput } from '@/components/ui';
import { lookupBarcode, type ProductInfo } from '@/lib/food-db';
import { analyzeFood, geminiConfigured, type FoodAnalysis } from '@/lib/gemini';
import { uid } from '@/lib/physique';
import { useApp } from '@/lib/store';
import { C, F } from '@/lib/theme';

/** Copy the picked photo out of the picker's temp cache into permanent app storage. */
async function persistPhoto(uri: string): Promise<string | undefined> {
  if (Platform.OS === 'web') return undefined;
  try {
    const dir = `${FileSystem.documentDirectory}meal-photos/`;
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const dest = `${dir}${uid()}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  } catch {
    return undefined;
  }
}

export default function MealAdd() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addMeal = useApp((s) => s.addMeal);
  const meals = useApp((s) => s.meals);
  const geminiKey = useApp((s) => s.apiKeys.gemini);

  // starred favourites + most recent distinct meals, for one-tap re-logging
  const distinct = meals.filter((m, i, arr) => arr.findIndex((x) => x.desc === m.desc) === i);
  const favorites = distinct.filter((m) => m.favorite).slice(0, 8);
  const recents = distinct.filter((m) => !m.favorite).slice(0, 6);

  const quickAdd = (m: (typeof meals)[number]) => {
    addMeal({
      time: Date.now(),
      desc: m.desc,
      kcal: m.kcal,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      sodium: m.sodium,
      items: m.items,
    });
    router.back();
  };

  const [photos, setPhotos] = useState<{ uri: string; base64: string | null }[]>([]);
  const [notes, setNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [analysisRun, setAnalysisRun] = useState(0);
  const [failed, setFailed] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);

  const [desc, setDesc] = useState('');
  const [kcal, setKcal] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [sodium, setSodium] = useState(0);

  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<ProductInfo | null>(null);
  const [grams, setGrams] = useState(100);
  const scannedOnce = useRef(false);

  const applyPortion = (p: ProductInfo, g: number) => {
    const f = g / 100;
    setDesc(`${p.name} (${g}g)`);
    setKcal(Math.round(p.per100g.kcal * f));
    setProtein(Math.round(p.per100g.protein * f));
    setCarbs(Math.round(p.per100g.carbs * f));
    setFat(Math.round(p.per100g.fat * f));
    setSodium(Math.round(p.per100g.sodium * f));
    setAnalysisRun((n) => n + 1); // refresh the pre-filled inputs
  };

  const openScanner = async () => {
    if (!camPerm?.granted) {
      const r = await requestCamPerm();
      if (!r.granted) return;
    }
    scannedOnce.current = false;
    setScanOpen(true);
  };

  const onBarcode = async (code: string) => {
    if (scannedOnce.current) return;
    scannedOnce.current = true;
    setScanOpen(false);
    setScanning(true);
    setFailed(false);
    setAiFailed(false);
    const p = await lookupBarcode(code);
    setScanning(false);
    if (p) {
      setProduct(p);
      setGrams(100);
      applyPortion(p, 100);
    } else {
      setFailed(true);
    }
  };

  const pickImage = async (camera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: 'images',
      quality: 0.5,
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
    };
    let result: ImagePicker.ImagePickerResult;
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ImagePicker.launchCameraAsync(opts);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(opts);
    }
    const asset = result.assets?.[0];
    if (asset) {
      setPhotos((cur) => [...cur, { uri: asset.uri, base64: asset.base64 ?? null }].slice(0, 4));
      setAnalysis(null);
      setFailed(false);
      setAiFailed(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setFailed(false);
    setAiFailed(false);
    const res = await analyzeFood(
      photos.map((p) => p.base64).filter((b): b is string => !!b),
      notes
    );
    setAnalyzing(false);
    if (res) {
      setAnalysis(res);
      setAnalysisRun((n) => n + 1);
      setDesc(res.desc);
      setKcal(res.kcal);
      setProtein(res.protein);
      setCarbs(res.carbs);
      setFat(res.fat);
      setSodium(res.sodium);
    } else {
      setAiFailed(true);
    }
  };

  const canSave = desc.trim().length > 0 || kcal > 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 + insets.bottom }}
      keyboardShouldPersistTaps="handled">
      {favorites.length > 0 && (
        <>
          <Dim small>FAVOURITES</Dim>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 10 }}>
            {favorites.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => quickAdd(m)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: C.redDark,
                  borderWidth: 1,
                  borderColor: C.red,
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  opacity: pressed ? 0.7 : 1,
                })}>
                <Text style={{ color: '#fff', fontSize: F.small, fontWeight: '700' }}>
                  ★ {m.desc} · {m.kcal} kcal
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      {recents.length > 0 && (
        <>
          <Dim small>QUICK ADD — recent meals (tap to log again)</Dim>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 12 }}>
            {recents.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => quickAdd(m)}
                style={({ pressed }) => ({
                  backgroundColor: C.cardAlt,
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 14,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  opacity: pressed ? 0.7 : 1,
                })}>
                <Text style={{ color: C.text, fontSize: F.small }}>
                  {m.desc} · {m.kcal} kcal
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn label="Take Photo" icon="camera" onPress={() => pickImage(true)} style={{ flex: 1 }} />
        <Btn label="Gallery" icon="images-outline" kind="ghost" onPress={() => pickImage(false)} style={{ flex: 1 }} />
      </View>
      <Btn
        label="Scan barcode (packaged food)"
        icon="barcode-outline"
        kind="ghost"
        style={{ marginTop: 10 }}
        onPress={openScanner}
      />
      {scanning && <ActivityIndicator color={C.red} style={{ marginTop: 10 }} />}
      {product && (
        <Card style={{ marginTop: 12, borderColor: C.ember }}>
          <H2>{product.name}</H2>
          <Dim small>
            Per 100g: {product.per100g.kcal} kcal · P {product.per100g.protein}g · C{' '}
            {product.per100g.carbs}g · F {product.per100g.fat}g
          </Dim>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <Dim>How much did you have? (g)</Dim>
            <NumInput
              value={grams}
              onChange={(n) => {
                const g = Math.max(1, Math.round(n));
                setGrams(g);
                applyPortion(product, g);
              }}
            />
          </View>
        </Card>
      )}

      {photos.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {photos.map((p, i) => (
            <View key={p.uri} style={{ width: photos.length === 1 ? '100%' : '48%' }}>
              <Image
                source={{ uri: p.uri }}
                style={{
                  width: '100%',
                  height: photos.length === 1 ? 220 : 130,
                  borderRadius: 12,
                  backgroundColor: C.card,
                }}
                contentFit="cover"
              />
              <Pressable
                onPress={() => setPhotos((cur) => cur.filter((_, x) => x !== i))}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  borderRadius: 12,
                  padding: 4,
                }}>
                <Text style={{ color: '#fff', fontSize: F.small, fontWeight: '700' }}> ✕ </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
      {photos.length > 0 && photos.length < 4 && (
        <Dim small>Add more angles/items with the buttons above (up to 4 photos).</Dim>
      )}

      <Dim small>
        {'\n'}Add corrections or items the photo can’t show — weights help a lot (e.g. “150g chicken
        breast, the sauce is low-fat, plus a can of coke not pictured”).
      </Dim>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes for the AI (or describe the meal fully if no photo)…"
        placeholderTextColor={C.textFaint}
        multiline
        style={{
          backgroundColor: C.card,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: 10,
          color: C.text,
          padding: 12,
          minHeight: 70,
          marginTop: 6,
          textAlignVertical: 'top',
        }}
      />

      {geminiKey.length > 0 || geminiConfigured() ? (
        <Btn
          label={analyzing ? 'Analyzing…' : 'Analyze with AI'}
          icon="sparkles"
          onPress={runAnalysis}
          style={{ marginTop: 12 }}
        />
      ) : (
        <Card style={{ marginTop: 12, borderColor: C.redDark }}>
          <H2>Enable AI photo analysis</H2>
          <Dim small>
            Snapping a photo and getting the macro breakdown automatically needs a free Gemini API
            key. Add yours in Settings — there’s a step-by-step guide on how to get one. Manual
            entry below works without it.
          </Dim>
          <Btn
            label="Add Gemini key in Settings"
            icon="key-outline"
            style={{ marginTop: 10, backgroundColor: C.ember }}
            onPress={() => router.push('/settings?focus=api')}
          />
        </Card>
      )}
      {analyzing && <ActivityIndicator color={C.red} style={{ marginTop: 12 }} />}
      {failed && (
        <Text style={{ color: C.red, fontSize: F.small, marginTop: 12 }}>
          Barcode lookup failed — not in database or no connection. Fill in manually below.
        </Text>
      )}
      {aiFailed && (
        <Text style={{ color: C.red, fontSize: F.small, marginTop: 12 }}>
          AI analysis failed — verify your Gemini key in Settings or check connection. Fill in manually below.
        </Text>
      )}

      <Modal visible={scanOpen} animationType="slide" onRequestClose={() => setScanOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
            }}
            onBarcodeScanned={({ data }) => onBarcode(data)}
          />
          <View style={{ position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center' }}>
            <Text
              style={{
                color: '#fff',
                fontSize: F.h2,
                fontWeight: '700',
                backgroundColor: 'rgba(0,0,0,0.6)',
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 10,
              }}>
              Point at the barcode
            </Text>
          </View>
          <View style={{ position: 'absolute', bottom: 48 + insets.bottom, left: 24, right: 24 }}>
            <Btn label="Cancel" kind="ghost" onPress={() => setScanOpen(false)} />
          </View>
        </View>
      </Modal>

      {analysis && (
        <Card style={{ marginTop: 12, borderColor: C.ember }}>
          <H2>AI breakdown</H2>
          {analysis.items.map((it, i) => {
            const hasUrl = it.sourceUrl && (it.sourceUrl.startsWith('http://') || it.sourceUrl.startsWith('https://'));
            return (
              <View key={`${it.name}-${i}`} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginVertical: 2 }}>
                <Text style={{ color: C.textDim, fontSize: F.small }}>
                  • {it.name} (~{it.grams}g): {it.kcal} kcal, P {it.protein}g, C {it.carbs}g, F {it.fat}g ·{' '}
                </Text>
                {it.source ? (
                  <Text style={{ color: C.textFaint, fontSize: F.small }}>
                    {it.source}
                    {hasUrl ? ': ' : ''}
                  </Text>
                ) : null}
                {hasUrl && (
                  <Text
                    style={{ color: C.red, fontSize: F.small, textDecorationLine: 'underline', fontWeight: '600' }}
                    onPress={() => Linking.openURL(it.sourceUrl!)}>
                    Source Link
                  </Text>
                )}
              </View>
            );
          })}
          <Text style={{ color: C.textFaint, fontSize: F.small, marginTop: 8 }}>Numbers below are pre-filled — adjust anything before saving.</Text>
        </Card>
      )}

      <Card style={{ marginTop: 16 }}>
        <H2>Meal details</H2>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="Meal name / description"
          placeholderTextColor={C.textFaint}
          style={{
            backgroundColor: C.cardAlt,
            borderWidth: 1,
            borderColor: C.border,
            borderRadius: 8,
            color: C.text,
            padding: 10,
            marginTop: 8,
          }}
        />
        {(
          [
            ['Calories (kcal)', kcal, setKcal],
            ['Protein (g)', protein, setProtein],
            ['Carbs (g)', carbs, setCarbs],
            ['Fat (g)', fat, setFat],
            ['Sodium (mg)', sodium, setSodium],
          ] as const
        ).map(([label, value, setter]) => (
          <View
            key={label}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <Text style={{ color: C.textDim, fontSize: F.body }}>{label}</Text>
            {/* remount inputs only when a fresh AI analysis pre-fills them */}
            <NumInput key={`${label}-${analysisRun}`} value={value} onChange={setter} />
          </View>
        ))}
      </Card>

      <Btn
        label={canSave ? 'Save Meal' : 'Add a description or calories first'}
        kind={canSave ? 'primary' : 'ghost'}
        style={{ marginTop: 8 }}
        onPress={async () => {
          if (!canSave) return;
          const photo = photos[0] ? await persistPhoto(photos[0].uri) : undefined;
          addMeal({
            time: Date.now(),
            desc: desc.trim() || 'Meal',
            kcal: Math.round(kcal),
            protein: Math.round(protein),
            carbs: Math.round(carbs),
            fat: Math.round(fat),
            sodium: Math.round(sodium),
            items: analysis?.items,
            photoUri: photo,
          });
          router.back();
        }}
      />
    </ScrollView>
  );
}
