import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import {
  Store,
  MapPin,
  DollarSign,
  Clock,
  CreditCard,
  Check,
  ArrowRight,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface StoreSetupProps {
  onComplete: () => void;
}

export default function StoreSetup({ onComplete }: StoreSetupProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [storeData, setStoreData] = useState({
    businessName: profile?.business_name || '',
    description: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
  });

  const [settingsData, setSettingsData] = useState({
    deliveryRadius: '10',
    minimumOrder: '0',
    acceptsOnlinePayment: false,
    acceptsCashOnDelivery: true,
    openingTime: '09:00',
    closingTime: '18:00',
  });

  const totalSteps = 3;

  const handleStoreInfoSubmit = () => {
    if (!storeData.businessName || !storeData.address) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSettingsSubmit = () => {
    if (!settingsData.deliveryRadius || !settingsData.minimumOrder) {
      setError('Please fill in all required fields');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: vendorData, error: vendorCheckError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', profile?.id)
        .maybeSingle();

      let vendorId = vendorData?.id;

      if (!vendorId) {
        const { data: newVendor, error: vendorError } = await supabase
          .from('vendors')
          .insert({
            user_id: profile?.id,
            business_name: storeData.businessName,
            description: storeData.description,
            address: storeData.address,
            city: storeData.city,
            state: storeData.state,
            postal_code: storeData.postalCode,
            is_verified: false,
            is_active: true,
          })
          .select()
          .single();

        if (vendorError) throw vendorError;
        vendorId = newVendor.id;
      }

      const storeHours = {
        monday: { open: settingsData.openingTime, close: settingsData.closingTime },
        tuesday: { open: settingsData.openingTime, close: settingsData.closingTime },
        wednesday: { open: settingsData.openingTime, close: settingsData.closingTime },
        thursday: { open: settingsData.openingTime, close: settingsData.closingTime },
        friday: { open: settingsData.openingTime, close: settingsData.closingTime },
        saturday: { open: settingsData.openingTime, close: settingsData.closingTime },
        sunday: { open: settingsData.openingTime, close: settingsData.closingTime },
      };

      const { error: settingsError } = await supabase.from('vendor_settings').upsert({
        vendor_id: vendorId,
        store_hours: storeHours,
        delivery_radius: parseFloat(settingsData.deliveryRadius),
        minimum_order: parseFloat(settingsData.minimumOrder),
        accepts_online_payment: settingsData.acceptsOnlinePayment,
        accepts_cash_on_delivery: settingsData.acceptsCashOnDelivery,
        is_setup_complete: true,
        updated_at: new Date().toISOString(),
      });

      if (settingsError) throw settingsError;

      onComplete();
    } catch (err: any) {
      console.error('Error setting up store:', err);
      setError(err.message || 'Failed to setup store');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              step >= s && styles.stepCircleActive,
              step > s && styles.stepCircleComplete,
            ]}
          >
            {step > s ? (
              <Check size={16} color="#ffffff" />
            ) : (
              <Text
                style={[styles.stepNumber, step >= s && styles.stepNumberActive]}
              >
                {s}
              </Text>
            )}
          </View>
          {s < 3 && (
            <View
              style={[styles.stepLine, step > s && styles.stepLineActive]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <Store size={48} color="#ff8c00" />
      </View>
      <Text style={styles.stepTitle}>Store Information</Text>
      <Text style={styles.stepDescription}>
        Tell us about your business
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput
          style={styles.input}
          value={storeData.businessName}
          onChangeText={(text) =>
            setStoreData({ ...storeData, businessName: text })
          }
          placeholder="Enter your business name"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={storeData.description}
          onChangeText={(text) =>
            setStoreData({ ...storeData, description: text })
          }
          placeholder="Describe your business"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Address *</Text>
        <TextInput
          style={styles.input}
          value={storeData.address}
          onChangeText={(text) =>
            setStoreData({ ...storeData, address: text })
          }
          placeholder="Street address"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={storeData.city}
            onChangeText={(text) =>
              setStoreData({ ...storeData, city: text })
            }
            placeholder="City"
            placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.label}>State</Text>
          <TextInput
            style={styles.input}
            value={storeData.state}
            onChangeText={(text) =>
              setStoreData({ ...storeData, state: text })
            }
            placeholder="State"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Postal Code</Text>
        <TextInput
          style={styles.input}
          value={storeData.postalCode}
          onChangeText={(text) =>
            setStoreData({ ...storeData, postalCode: text })
          }
          placeholder="Postal code"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleStoreInfoSubmit}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
        <ArrowRight size={20} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <MapPin size={48} color="#ff8c00" />
      </View>
      <Text style={styles.stepTitle}>Delivery & Pricing</Text>
      <Text style={styles.stepDescription}>
        Configure your delivery options
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Delivery Radius (km) *</Text>
        <TextInput
          style={styles.input}
          value={settingsData.deliveryRadius}
          onChangeText={(text) =>
            setSettingsData({ ...settingsData, deliveryRadius: text })
          }
          placeholder="10"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Minimum Order Amount ($) *</Text>
        <TextInput
          style={styles.input}
          value={settingsData.minimumOrder}
          onChangeText={(text) =>
            setSettingsData({ ...settingsData, minimumOrder: text })
          }
          placeholder="0"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Store Hours</Text>
        <View style={styles.row}>
          <View style={[styles.flex1, { marginRight: 8 }]}>
            <Text style={styles.subLabel}>Opening Time</Text>
            <TextInput
              style={styles.input}
              value={settingsData.openingTime}
              onChangeText={(text) =>
                setSettingsData({ ...settingsData, openingTime: text })
              }
              placeholder="09:00"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.subLabel}>Closing Time</Text>
            <TextInput
              style={styles.input}
              value={settingsData.closingTime}
              onChangeText={(text) =>
                setSettingsData({ ...settingsData, closingTime: text })
              }
              placeholder="18:00"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(1)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleSettingsSubmit}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <ArrowRight size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconContainer}>
        <CreditCard size={48} color="#ff8c00" />
      </View>
      <Text style={styles.stepTitle}>Payment Options</Text>
      <Text style={styles.stepDescription}>
        Choose how customers can pay
      </Text>

      <View style={styles.switchGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Accept Online Payment</Text>
            <Text style={styles.switchDescription}>
              Credit/Debit cards, digital wallets
            </Text>
          </View>
          <Switch
            value={settingsData.acceptsOnlinePayment}
            onValueChange={(value) =>
              setSettingsData({ ...settingsData, acceptsOnlinePayment: value })
            }
            trackColor={{ false: '#d1d5db', true: '#ff8c00' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Cash on Delivery</Text>
            <Text style={styles.switchDescription}>
              Accept cash when order is delivered
            </Text>
          </View>
          <Switch
            value={settingsData.acceptsCashOnDelivery}
            onValueChange={(value) =>
              setSettingsData({ ...settingsData, acceptsCashOnDelivery: value })
            }
            trackColor={{ false: '#d1d5db', true: '#ff8c00' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(2)}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.completeButton, loading && styles.buttonDisabled]}
          onPress={handleFinalSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Check size={20} color="#ffffff" />
              <Text style={styles.completeButtonText}>Complete Setup</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Get Started</Text>
        <Text style={styles.subtitle}>
          Step {step} of {totalSteps}
        </Text>
      </View>

      {renderStepIndicator()}

      <View style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ff8c00',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#d1fae5',
    marginTop: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#ff8c00',
  },
  stepCircleComplete: {
    backgroundColor: '#059669',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9ca3af',
  },
  stepNumberActive: {
    color: '#ffffff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#ff8c00',
  },
  content: {
    padding: 20,
  },
  stepContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 2.5,
    borderColor: '#ff8c00',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  switchGroup: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#ff8c00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#ff8c00',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
