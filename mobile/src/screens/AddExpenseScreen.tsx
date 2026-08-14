import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, ActionSheetIOS } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { apiFetch, getToken, API_BASE, sendCategorizationFeedback } from '../api/client';
import { enqueueOperation, getNetworkStatus, addNetworkListener, isSyncing, syncQueue } from '../api/offline-queue';
import * as ImagePicker from 'expo-image-picker';

const CATEGORIES = ['materials', 'labor', 'travel', 'equipment', 'software', 'rent', 'utilities', 'marketing', 'other'];

export function AddExpenseScreen() {
  const nav = useNavigation<any>();
  const [category, setCategory] = useState('materials');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [predictedCategory, setPredictedCategory] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = addNetworkListener(() => {
      setIsOnline(getNetworkStatus());
      setSyncing(isSyncing());
    });
    setIsOnline(getNetworkStatus());
    return unsubscribe;
  }, []);

  const handleSave = async () => {
    if (!vendor || !amount) { Alert.alert('Error', 'Vendor and amount are required'); return; }
    setLoading(true);
    try {
      const body: any = { category, vendor, amount: parseFloat(amount), date, description };
      
      if (!isOnline) {
        // Queue for offline sync
        await enqueueOperation('create_expense', body);
        Alert.alert('Saved Offline', 'Expense will sync when you are back online');
        nav.goBack();
        return;
      }

      if (receiptUri) {
        // Upload receipt image
        const formData = new FormData();
        formData.append('receipt', {
          uri: receiptUri,
          type: 'image/jpeg',
          name: 'receipt.jpg',
        } as any);
        
        const token = await getToken();
        const res = await fetch(`${API_BASE}/expenses/scan`, {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });
        
        if (res.ok) {
          const data = await res.json();
          // Use extracted data but allow user overrides
          if (data.extracted?.vendor && !vendor) body.vendor = data.extracted.vendor;
          if (data.extracted?.amount && !amount) body.amount = data.extracted.amount;
          if (data.extracted?.category) body.category = data.extracted.category;
          if (data.extracted?.date) body.date = data.extracted.date;
        }
      }
      
      await apiFetch('/expenses', { method: 'POST', body: JSON.stringify(body) });
      nav.goBack();
    } catch (e: any) {
      // If network error, queue for offline sync
      if (!isOnline || e.message.includes('Network') || e.message.includes('fetch')) {
        const body: any = { category, vendor, amount: parseFloat(amount), date, description };
        await enqueueOperation('create_expense', body);
        Alert.alert('Saved Offline', 'Expense will sync when you are back online');
        nav.goBack();
      } else {
        Alert.alert('Error', e.message);
      }
    } finally { setLoading(false); }
  };

  const handleCategoryChange = async (newCategory: string) => {
    // Send feedback if user changed from predicted category
    if (predictedCategory && ocrText && newCategory !== predictedCategory) {
      try {
        await sendCategorizationFeedback(ocrText, vendor, predictedCategory, newCategory);
      } catch (e) {
        console.warn('Failed to send categorization feedback:', e);
      }
    }
    setCategory(newCategory);
  };

  const scanReceipt = async () => {
    const showOptions = () => {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
            cancelButtonIndex: 0,
          },
          handleSelection
        );
      } else {
        // Android: use Alert as simple action sheet
        Alert.alert('Scan Receipt', 'Choose source', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => handleSelection(1) },
          { text: 'Choose from Gallery', onPress: () => handleSelection(2) },
        ]);
      }
    };

    const handleSelection = async (index: number) => {
      if (index === 0) return; // Cancel
      
      const isCamera = index === 1;
      const requestPermission = isCamera 
        ? ImagePicker.requestCameraPermissionsAsync 
        : ImagePicker.requestMediaLibraryPermissionsAsync;
      const launchPicker = isCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('Permission needed', `${isCamera ? 'Camera' : 'Media library'} permission is required`);
        return;
      }

      setScanning(true);
      try {
        const result = await launchPicker({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setReceiptUri(result.assets[0].uri);
          // Auto-extract data from receipt
          const formData = new FormData();
          formData.append('receipt', {
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            name: 'receipt.jpg',
          } as any);

          const token = await getToken();
          const res = await fetch(`${API_BASE}/expenses/scan`, {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.extracted) {
              if (data.extracted.vendor) setVendor(data.extracted.vendor);
              if (data.extracted.amount) setAmount(String(data.extracted.amount));
              if (data.extracted.category) {
                setCategory(data.extracted.category);
                setPredictedCategory(data.extracted.category);
              }
              if (data.extracted.date) setDate(data.extracted.date);
              if (data.extracted.description) setDescription(data.extracted.description);
              if (data.extracted.rawText) setOcrText(data.extracted.rawText);
            }
          }
        }
      } catch (e: any) {
        Alert.alert('Error', 'Failed to scan receipt: ' + e.message);
      } finally {
        setScanning(false);
      }
    };

    showOptions();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>⚠️ Offline — changes will sync when online</Text>
          </View>
        )}
        {syncing && (
          <View style={styles.syncBanner}>
            <Text style={styles.syncText}>🔄 Syncing...</Text>
          </View>
        )}
        <Text style={styles.label}>Category</Text>
        <View style={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => handleCategoryChange(cat)} style={[styles.catPill, category === cat && styles.catActive]}>
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={scanReceipt} disabled={scanning}>
          <Text style={styles.scanButtonText}>{scanning ? 'Scanning...' : '📷 Scan Receipt'}</Text>
        </TouchableOpacity>
        {receiptUri && (
          <View style={styles.receiptPreview}>
            <Text style={styles.label}>Receipt Captured</Text>
            <Text style={styles.receiptText}>Tap to re-scan</Text>
          </View>
        )}
        <Text style={styles.label}>Vendor</Text>
        <TextInput style={styles.input} value={vendor} onChangeText={setVendor} placeholder="Vendor name" placeholderTextColor="#94a3b8" />
        <Text style={styles.label}>Amount</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#94a3b8" keyboardType="decimal-pad" />
        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" />
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} multiline placeholder="Notes..." placeholderTextColor="#94a3b8" />
        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Expense'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '500', marginBottom: 4 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, color: '#fff', fontSize: 16 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  catPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b' },
  catActive: { backgroundColor: '#4f46e5' },
  catText: { color: '#94a3b8', fontSize: 13, textTransform: 'capitalize' },
  catTextActive: { color: '#fff', fontWeight: '600' },
  button: { backgroundColor: '#4f46e5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  scanButton: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#334155' },
  scanButtonText: { color: '#4f46e5', fontSize: 16, fontWeight: '600' },
  receiptPreview: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginTop: 8, alignItems: 'center' },
  receiptText: { color: '#64748b', fontSize: 14 },
  offlineBanner: { backgroundColor: '#78350f', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#92400e' },
  offlineText: { color: '#fde68a', fontSize: 14, textAlign: 'center', fontWeight: '500' },
  syncBanner: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1e40af' },
  syncText: { color: '#93c5fd', fontSize: 14, textAlign: 'center', fontWeight: '500' },
});
