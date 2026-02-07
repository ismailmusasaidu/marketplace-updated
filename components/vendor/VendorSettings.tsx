import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Save, Store, Upload, Image as ImageIcon, X, CreditCard, Clock, Share2, Truck } from 'lucide-react-native';
import { Fonts } from '@/constants/fonts';

interface VendorSettingsData {
  id: string;
  vendor_id: string;
  delivery_radius: number;
  minimum_order: number;
  accepts_online_payment: boolean;
  accepts_cash_on_delivery: boolean;
  store_banner_url: string | null;
  store_hours: Record<string, { open: string; close: string; closed: boolean }>;
  social_media: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function VendorSettings() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [settings, setSettings] = useState<VendorSettingsData | null>(null);

  const [deliveryRadius, setDeliveryRadius] = useState('10');
  const [minimumOrder, setMinimumOrder] = useState('0');
  const [acceptsOnlinePayment, setAcceptsOnlinePayment] = useState(false);
  const [acceptsCashOnDelivery, setAcceptsCashOnDelivery] = useState(true);
  const [storeBannerUrl, setStoreBannerUrl] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [storeHours, setStoreHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>({});

  useEffect(() => {
    if (profile?.role === 'vendor') {
      fetchVendorSettings();
    }
  }, [profile]);

  const fetchVendorSettings = async () => {
    if (!profile) return;

    try {
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (vendorError) throw vendorError;
      if (!vendorData) {
        showToast('Vendor profile not found', 'error');
        setLoading(false);
        return;
      }

      setVendorId(vendorData.id);

      const { data: settingsData, error: settingsError } = await supabase
        .from('vendor_settings')
        .select('*')
        .eq('vendor_id', vendorData.id)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      if (settingsData) {
        setSettings(settingsData);
        setDeliveryRadius(settingsData.delivery_radius?.toString() || '10');
        setMinimumOrder(settingsData.minimum_order?.toString() || '0');
        setAcceptsOnlinePayment(settingsData.accepts_online_payment || false);
        setAcceptsCashOnDelivery(settingsData.accepts_cash_on_delivery ?? true);
        setStoreBannerUrl(settingsData.store_banner_url || '');

        const socialMedia = settingsData.social_media || {};
        setFacebook(socialMedia.facebook || '');
        setInstagram(socialMedia.instagram || '');
        setTwitter(socialMedia.twitter || '');
        setWhatsapp(socialMedia.whatsapp || '');

        const hours = settingsData.store_hours || {};
        const defaultHours: Record<string, { open: string; close: string; closed: boolean }> = {};
        DAYS.forEach(day => {
          defaultHours[day] = hours[day] || { open: '09:00', close: '17:00', closed: false };
        });
        setStoreHours(defaultHours);
      } else {
        const defaultHours: Record<string, { open: string; close: string; closed: boolean }> = {};
        DAYS.forEach(day => {
          defaultHours[day] = { open: '09:00', close: '17:00', closed: false };
        });
        setStoreHours(defaultHours);
      }
    } catch (error) {
      console.error('Error fetching vendor settings:', error);
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadBanner = async () => {
    if (!vendorId) {
      showToast('Vendor ID not found', 'error');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showToast('Permission to access media library is required', 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const image = result.assets[0];
      setUploading(true);

      const fileExt = image.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${vendorId}/${Date.now()}.${fileExt}`;

      let fileData: Blob | ArrayBuffer;

      if (Platform.OS === 'web') {
        const response = await fetch(image.uri);
        fileData = await response.blob();
      } else {
        const response = await fetch(image.uri);
        fileData = await response.arrayBuffer();
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendor-banners')
        .upload(fileName, fileData, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-banners')
        .getPublicUrl(fileName);

      setStoreBannerUrl(publicUrl);

      if (settings) {
        const { error: updateError } = await supabase
          .from('vendor_settings')
          .update({
            store_banner_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', settings.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('vendor_settings')
          .insert({
            vendor_id: vendorId,
            delivery_radius: parseFloat(deliveryRadius) || 10,
            minimum_order: parseFloat(minimumOrder) || 0,
            accepts_online_payment: acceptsOnlinePayment,
            accepts_cash_on_delivery: acceptsCashOnDelivery,
            store_banner_url: publicUrl,
            social_media: {},
            store_hours: storeHours,
          });

        if (insertError) throw insertError;
      }

      showToast('Banner uploaded and saved successfully', 'success');
      await fetchVendorSettings();
    } catch (error) {
      console.error('Error uploading banner:', error);
      showToast('Failed to upload banner', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!vendorId) {
      showToast('Vendor ID not found', 'error');
      return;
    }

    const radius = parseFloat(deliveryRadius);
    const minOrder = parseFloat(minimumOrder);

    if (isNaN(radius) || radius < 0) {
      showToast('Please enter a valid delivery radius', 'warning');
      return;
    }

    if (isNaN(minOrder) || minOrder < 0) {
      showToast('Please enter a valid minimum order amount', 'warning');
      return;
    }

    setSaving(true);
    try {
      const updatedSettings = {
        vendor_id: vendorId,
        delivery_radius: radius,
        minimum_order: minOrder,
        accepts_online_payment: acceptsOnlinePayment,
        accepts_cash_on_delivery: acceptsCashOnDelivery,
        store_banner_url: storeBannerUrl || null,
        social_media: {
          facebook: facebook || undefined,
          instagram: instagram || undefined,
          twitter: twitter || undefined,
          whatsapp: whatsapp || undefined,
        },
        store_hours: storeHours,
        updated_at: new Date().toISOString(),
      };

      if (settings) {
        const { error } = await supabase
          .from('vendor_settings')
          .update(updatedSettings)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vendor_settings')
          .insert(updatedSettings);

        if (error) throw error;
      }

      showToast('Settings saved successfully!', 'success');
      fetchVendorSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateStoreHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setStoreHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1c1917" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Store size={22} color="#ff8c00" />
        </View>
        <Text style={styles.headerTitle}>Store Settings</Text>
      </View>

      <View style={styles.sectionGroup}>
        <View style={styles.sectionHeader}>
          <Truck size={18} color="#78716c" />
          <Text style={styles.sectionTitle}>Delivery Settings</Text>
        </View>
        <View style={styles.sectionCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Delivery Radius (km)</Text>
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={deliveryRadius}
              onChangeText={setDeliveryRadius}
              keyboardType="decimal-pad"
              placeholder="10"
              placeholderTextColor="#a8a29e"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Minimum Order Amount ({'\u20A6'})</Text>
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={minimumOrder}
              onChangeText={setMinimumOrder}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#a8a29e"
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionGroup}>
        <View style={styles.sectionHeader}>
          <CreditCard size={18} color="#78716c" />
          <Text style={styles.sectionTitle}>Payment Methods</Text>
        </View>
        <View style={styles.sectionCard}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Accept Online Payment</Text>
            <Switch
              value={acceptsOnlinePayment}
              onValueChange={setAcceptsOnlinePayment}
              trackColor={{ false: '#d6d3d1', true: '#fed7aa' }}
              thumbColor={acceptsOnlinePayment ? '#ff8c00' : '#fafaf9'}
            />
          </View>

          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.switchLabel}>Accept Cash on Delivery</Text>
            <Switch
              value={acceptsCashOnDelivery}
              onValueChange={setAcceptsCashOnDelivery}
              trackColor={{ false: '#d6d3d1', true: '#fed7aa' }}
              thumbColor={acceptsCashOnDelivery ? '#ff8c00' : '#fafaf9'}
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionGroup}>
        <View style={styles.sectionHeader}>
          <ImageIcon size={18} color="#78716c" />
          <Text style={styles.sectionTitle}>Store Banner</Text>
        </View>
        <View style={styles.sectionCard}>
          {storeBannerUrl ? (
            <View style={styles.bannerPreview}>
              <Image
                source={{ uri: storeBannerUrl }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeBannerBtn}
                onPress={() => setStoreBannerUrl('')}
              >
                <X size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noBannerPreview}>
              <ImageIcon size={40} color="#d6d3d1" />
              <Text style={styles.noBannerText}>No banner uploaded</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.uploadBtn, uploading && { opacity: 0.6 }]}
            onPress={pickAndUploadBanner}
            disabled={uploading}
            activeOpacity={0.7}
          >
            {uploading ? (
              <>
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.uploadBtnText}>Uploading...</Text>
              </>
            ) : (
              <>
                <Upload size={18} color="#fff" />
                <Text style={styles.uploadBtnText}>
                  {storeBannerUrl ? 'Change Banner' : 'Upload Banner'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.inputGroup, { marginBottom: 0 }]}>
            <Text style={styles.label}>Or enter image URL</Text>
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={storeBannerUrl}
              onChangeText={setStoreBannerUrl}
              placeholder="https://example.com/banner.jpg"
              placeholderTextColor="#a8a29e"
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionGroup}>
        <View style={styles.sectionHeader}>
          <Clock size={18} color="#78716c" />
          <Text style={styles.sectionTitle}>Store Hours</Text>
        </View>
        <View style={styles.sectionCard}>
          {DAYS.map((day, index) => (
            <View key={day} style={[styles.dayRow, index === DAYS.length - 1 && { marginBottom: 0 }]}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day}</Text>
                <View style={styles.closedSwitch}>
                  <Text style={styles.closedLabel}>Closed</Text>
                  <Switch
                    value={storeHours[day]?.closed || false}
                    onValueChange={(value) => updateStoreHours(day, 'closed', value)}
                    trackColor={{ false: '#d6d3d1', true: '#fed7aa' }}
                    thumbColor={storeHours[day]?.closed ? '#ff8c00' : '#fafaf9'}
                  />
                </View>
              </View>
              {!storeHours[day]?.closed && (
                <View style={styles.timeRow}>
                  <View style={styles.timeInput}>
                    <Text style={styles.timeLabel}>Open</Text>
                    <TextInput
                      style={[styles.input, styles.timeField, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                      value={storeHours[day]?.open || '09:00'}
                      onChangeText={(value) => updateStoreHours(day, 'open', value)}
                      placeholder="09:00"
                      placeholderTextColor="#a8a29e"
                    />
                  </View>
                  <View style={styles.timeInput}>
                    <Text style={styles.timeLabel}>Close</Text>
                    <TextInput
                      style={[styles.input, styles.timeField, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                      value={storeHours[day]?.close || '17:00'}
                      onChangeText={(value) => updateStoreHours(day, 'close', value)}
                      placeholder="17:00"
                      placeholderTextColor="#a8a29e"
                    />
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionGroup}>
        <View style={styles.sectionHeader}>
          <Share2 size={18} color="#78716c" />
          <Text style={styles.sectionTitle}>Social Media</Text>
        </View>
        <View style={styles.sectionCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Facebook</Text>
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={facebook}
              onChangeText={setFacebook}
              placeholder="https://facebook.com/yourstore"
              placeholderTextColor="#a8a29e"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instagram</Text>
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={instagram}
              onChangeText={setInstagram}
              placeholder="https://instagram.com/yourstore"
              placeholderTextColor="#a8a29e"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Twitter</Text>
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={twitter}
              onChangeText={setTwitter}
              placeholder="https://twitter.com/yourstore"
              placeholderTextColor="#a8a29e"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputGroup, { marginBottom: 0 }]}>
            <Text style={styles.label}>WhatsApp</Text>
            <TextInput
              style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="+234XXXXXXXXXX"
              placeholderTextColor="#a8a29e"
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Save size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Save Settings</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: Fonts.groteskBold,
    color: '#1c1917',
    letterSpacing: -0.5,
  },
  sectionGroup: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Fonts.groteskSemiBold,
    color: '#78716c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.groteskSemiBold,
    color: '#44403c',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: Fonts.grotesk,
    color: '#1c1917',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  switchLabel: {
    fontSize: 15,
    fontFamily: Fonts.groteskMedium,
    color: '#44403c',
  },
  dayRow: {
    marginBottom: 14,
    padding: 14,
    backgroundColor: '#fafaf9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayName: {
    fontSize: 15,
    fontFamily: Fonts.groteskSemiBold,
    color: '#1c1917',
  },
  closedSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closedLabel: {
    fontSize: 13,
    fontFamily: Fonts.grotesk,
    color: '#78716c',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: Fonts.groteskMedium,
    color: '#a8a29e',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timeField: {
    padding: 10,
  },
  bannerPreview: {
    width: '100%',
    height: 170,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  removeBannerBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(28,25,23,0.7)',
    borderRadius: 16,
    padding: 6,
  },
  noBannerPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#fafaf9',
    borderWidth: 1.5,
    borderColor: '#e7e5e4',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  noBannerText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: Fonts.groteskMedium,
    color: '#a8a29e',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1917',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  uploadBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts.groteskSemiBold,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1c1917',
    marginHorizontal: 16,
    marginTop: 4,
    padding: 16,
    borderRadius: 14,
    gap: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: Fonts.groteskBold,
  },
});
