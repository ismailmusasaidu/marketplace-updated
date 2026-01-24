import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DeliveryLogs from './DeliveryLogs';

interface DeliveryZone {
  id: string;
  name: string;
  description: string;
  min_distance_km: number;
  max_distance_km: number;
  price: number;
  is_active: boolean;
}

interface DeliveryPricing {
  id: string;
  default_base_price: number;
  default_price_per_km: number;
  min_delivery_charge: number;
  max_delivery_distance_km: number;
  free_delivery_threshold: number;
}

interface Promotion {
  id: string;
  code: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed_amount' | 'free_delivery';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number;
  valid_from: string;
  valid_until: string;
  usage_limit: number;
  usage_count: number;
  is_active: boolean;
}

export default function DeliveryManagement() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'zones' | 'pricing' | 'promotions' | 'logs'>('zones');
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [pricing, setPricing] = useState<DeliveryPricing | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'zones') {
        await loadZones();
      } else if (activeTab === 'pricing') {
        await loadPricing();
      } else if (activeTab === 'promotions') {
        await loadPromotions();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    const { data, error } = await supabase
      .from('delivery_zones')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setZones(data);
    }
  };

  const loadPricing = async () => {
    const { data, error } = await supabase
      .from('delivery_pricing')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setPricing(data);
    }
  };

  const loadPromotions = async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPromotions(data);
    }
  };

  const saveZone = async () => {
    if (!editingZone) return;

    const { error } = editingZone.id.startsWith('new-')
      ? await supabase.from('delivery_zones').insert([{
          name: editingZone.name,
          description: editingZone.description,
          min_distance_km: editingZone.min_distance_km,
          max_distance_km: editingZone.max_distance_km,
          price: editingZone.price,
          is_active: editingZone.is_active,
        }])
      : await supabase.from('delivery_zones').update({
          name: editingZone.name,
          description: editingZone.description,
          min_distance_km: editingZone.min_distance_km,
          max_distance_km: editingZone.max_distance_km,
          price: editingZone.price,
          is_active: editingZone.is_active,
          updated_at: new Date().toISOString(),
        }).eq('id', editingZone.id);

    if (!error) {
      setEditingZone(null);
      loadZones();
    }
  };

  const savePricing = async () => {
    if (!pricing) return;

    const { error } = await supabase
      .from('delivery_pricing')
      .update({
        default_base_price: pricing.default_base_price,
        default_price_per_km: pricing.default_price_per_km,
        min_delivery_charge: pricing.min_delivery_charge,
        max_delivery_distance_km: pricing.max_delivery_distance_km,
        free_delivery_threshold: pricing.free_delivery_threshold,
        updated_at: new Date().toISOString(),
        updated_by: profile?.id,
      })
      .eq('id', pricing.id);

    if (!error) {
      Alert.alert('Success', 'Pricing updated successfully');
    }
  };

  const savePromotion = async () => {
    if (!editingPromotion) return;

    const { error } = editingPromotion.id.startsWith('new-')
      ? await supabase.from('promotions').insert([{
          code: editingPromotion.code,
          name: editingPromotion.name,
          description: editingPromotion.description,
          discount_type: editingPromotion.discount_type,
          discount_value: editingPromotion.discount_value,
          min_order_amount: editingPromotion.min_order_amount,
          max_discount_amount: editingPromotion.max_discount_amount,
          valid_from: editingPromotion.valid_from,
          valid_until: editingPromotion.valid_until,
          usage_limit: editingPromotion.usage_limit,
          is_active: editingPromotion.is_active,
          created_by: profile?.id,
        }])
      : await supabase.from('promotions').update({
          code: editingPromotion.code,
          name: editingPromotion.name,
          description: editingPromotion.description,
          discount_type: editingPromotion.discount_type,
          discount_value: editingPromotion.discount_value,
          min_order_amount: editingPromotion.min_order_amount,
          max_discount_amount: editingPromotion.max_discount_amount,
          valid_from: editingPromotion.valid_from,
          valid_until: editingPromotion.valid_until,
          usage_limit: editingPromotion.usage_limit,
          is_active: editingPromotion.is_active,
        }).eq('id', editingPromotion.id);

    if (!error) {
      setEditingPromotion(null);
      loadPromotions();
    }
  };

  const deleteZone = async (id: string) => {
    const { error } = await supabase
      .from('delivery_zones')
      .delete()
      .eq('id', id);

    if (!error) {
      loadZones();
    }
  };

  const deletePromotion = async (id: string) => {
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id);

    if (!error) {
      loadPromotions();
    }
  };

  const renderZonesTab = () => {
    if (editingZone) {
      return (
        <View style={styles.tabContent}>
          <ScrollView contentContainerStyle={styles.formContainer}>
            <View style={styles.formHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setEditingZone(null)}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.formTitle}>
                {editingZone.id.startsWith('new-') ? 'Add Zone' : 'Edit Zone'}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Zone Name (e.g., ZONE A, City Center)"
              value={editingZone.name}
              onChangeText={(text) => setEditingZone({ ...editingZone, name: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (e.g., Covers downtown and nearby areas)"
              value={editingZone.description}
              onChangeText={(text) => setEditingZone({ ...editingZone, description: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TextInput
              style={styles.input}
              placeholder="Minimum Distance (e.g., 0 for starting point)"
              value={editingZone.min_distance_km === 0 && editingZone.id.startsWith('new-') ? '' : String(editingZone.min_distance_km)}
              onChangeText={(text) => setEditingZone({ ...editingZone, min_distance_km: parseFloat(text) || 0 })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Maximum Distance (e.g., 5 for 5km radius)"
              value={editingZone.max_distance_km === 0 && editingZone.id.startsWith('new-') ? '' : String(editingZone.max_distance_km)}
              onChangeText={(text) => setEditingZone({ ...editingZone, max_distance_km: parseFloat(text) || 0 })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Delivery Price (e.g., 500 for ₦500)"
              value={editingZone.price === 0 && editingZone.id.startsWith('new-') ? '' : String(editingZone.price)}
              onChangeText={(text) => setEditingZone({ ...editingZone, price: parseFloat(text) || 0 })}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setEditingZone({ ...editingZone, is_active: !editingZone.is_active })}
            >
              <View style={[styles.checkbox, editingZone.is_active && styles.checkboxChecked]}>
                {editingZone.is_active && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Active</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveZone}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setEditingZone({
            id: `new-${Date.now()}`,
            name: '',
            description: '',
            min_distance_km: 0,
            max_distance_km: 0,
            price: 0,
            is_active: true,
          })}
        >
          <Text style={styles.addButtonText}>Add New Zone</Text>
        </TouchableOpacity>

        {zones.map((zone) => (
          <View key={zone.id} style={[styles.card, !zone.is_active && styles.inactiveCard]}>
            <Text style={styles.cardTitle}>{zone.name}</Text>
            <Text style={styles.cardText}>{zone.description}</Text>
            <Text style={styles.cardText}>Distance Range: {zone.min_distance_km} - {zone.max_distance_km} km</Text>
            <Text style={styles.cardText}>Delivery Price: ₦{zone.price}</Text>
            <Text style={styles.cardText}>Status: {zone.is_active ? 'Active' : 'Inactive'}</Text>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditingZone(zone)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteZone(zone.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderPricingTab = () => (
    <View style={styles.tabContent}>
      {pricing && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Global Delivery Pricing</Text>

          <Text style={styles.label}>Default Base Price (₦)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 200"
            value={String(pricing.default_base_price)}
            onChangeText={(text) => setPricing({ ...pricing, default_base_price: parseFloat(text) || 0 })}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Default Price per km (₦)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 50"
            value={String(pricing.default_price_per_km)}
            onChangeText={(text) => setPricing({ ...pricing, default_price_per_km: parseFloat(text) || 0 })}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Minimum Delivery Charge (₦)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 100"
            value={String(pricing.min_delivery_charge)}
            onChangeText={(text) => setPricing({ ...pricing, min_delivery_charge: parseFloat(text) || 0 })}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Maximum Delivery Distance (km)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 20"
            value={String(pricing.max_delivery_distance_km)}
            onChangeText={(text) => setPricing({ ...pricing, max_delivery_distance_km: parseFloat(text) || 0 })}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Free Delivery Threshold (₦)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5000"
            value={String(pricing.free_delivery_threshold)}
            onChangeText={(text) => setPricing({ ...pricing, free_delivery_threshold: parseFloat(text) || 0 })}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={savePricing}
          >
            <Text style={styles.saveButtonText}>Save Pricing</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderPromotionsTab = () => {
    if (editingPromotion) {
      return (
        <View style={styles.tabContent}>
          <ScrollView contentContainerStyle={styles.formContainer}>
            <View style={styles.formHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setEditingPromotion(null)}
              >
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.formTitle}>
                {editingPromotion.id.startsWith('new-') ? 'Add Promotion' : 'Edit Promotion'}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Promotion Code"
              value={editingPromotion.code}
              onChangeText={(text) => setEditingPromotion({ ...editingPromotion, code: text.toUpperCase() })}
            />

            <TextInput
              style={styles.input}
              placeholder="Promotion Name"
              value={editingPromotion.name}
              onChangeText={(text) => setEditingPromotion({ ...editingPromotion, name: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={editingPromotion.description}
              onChangeText={(text) => setEditingPromotion({ ...editingPromotion, description: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Discount Type</Text>
            <View style={styles.radioGroup}>
              {['percentage', 'fixed_amount', 'free_delivery'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.radioOption}
                  onPress={() => setEditingPromotion({ ...editingPromotion, discount_type: type as any })}
                >
                  <View style={[styles.radio, editingPromotion.discount_type === type && styles.radioSelected]} />
                  <Text style={styles.radioLabel}>{type.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Discount Value (e.g., 10 for 10% or ₦100)"
              value={editingPromotion.discount_value === 0 && editingPromotion.id.startsWith('new-') ? '' : String(editingPromotion.discount_value)}
              onChangeText={(text) => setEditingPromotion({ ...editingPromotion, discount_value: parseFloat(text) || 0 })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Min Order Amount (e.g., 1000 for ₦1000)"
              value={editingPromotion.min_order_amount === 0 && editingPromotion.id.startsWith('new-') ? '' : String(editingPromotion.min_order_amount)}
              onChangeText={(text) => setEditingPromotion({ ...editingPromotion, min_order_amount: parseFloat(text) || 0 })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Usage Limit (0 for unlimited)"
              value={String(editingPromotion.usage_limit)}
              onChangeText={(text) => setEditingPromotion({ ...editingPromotion, usage_limit: parseInt(text) || 0 })}
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Valid From</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (e.g., 2026-01-01)"
              value={editingPromotion.valid_from ? new Date(editingPromotion.valid_from).toISOString().split('T')[0] : ''}
              onChangeText={(text) => {
                const date = new Date(text);
                if (!isNaN(date.getTime())) {
                  setEditingPromotion({ ...editingPromotion, valid_from: date.toISOString() });
                }
              }}
            />

            <Text style={styles.label}>Valid Until</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD (e.g., 2026-12-31)"
              value={editingPromotion.valid_until ? new Date(editingPromotion.valid_until).toISOString().split('T')[0] : ''}
              onChangeText={(text) => {
                const date = new Date(text + 'T23:59:59.999Z');
                if (!isNaN(date.getTime())) {
                  setEditingPromotion({ ...editingPromotion, valid_until: date.toISOString() });
                }
              }}
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setEditingPromotion({ ...editingPromotion, is_active: !editingPromotion.is_active })}
            >
              <View style={[styles.checkbox, editingPromotion.is_active && styles.checkboxChecked]}>
                {editingPromotion.is_active && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Active</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={savePromotion}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            const now = new Date();
            const nextMonth = new Date(now);
            nextMonth.setMonth(now.getMonth() + 1);
            nextMonth.setHours(23, 59, 59, 999);

            setEditingPromotion({
              id: `new-${Date.now()}`,
              code: '',
              name: '',
              description: '',
              discount_type: 'percentage',
              discount_value: 0,
              min_order_amount: 0,
              max_discount_amount: 0,
              valid_from: now.toISOString(),
              valid_until: nextMonth.toISOString(),
              usage_limit: 0,
              usage_count: 0,
              is_active: true,
            });
          }}
        >
          <Text style={styles.addButtonText}>Add New Promotion</Text>
        </TouchableOpacity>

        {promotions.map((promo) => (
          <View key={promo.id} style={[styles.card, !promo.is_active && styles.inactiveCard]}>
            <Text style={styles.cardTitle}>{promo.name}</Text>
            <Text style={styles.cardText}>Code: {promo.code}</Text>
            <Text style={styles.cardText}>{promo.description}</Text>
            <Text style={styles.cardText}>Type: {promo.discount_type}</Text>
            <Text style={styles.cardText}>Value: {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `₦${promo.discount_value}`}</Text>
            <Text style={styles.cardText}>Min Order: ₦{promo.min_order_amount}</Text>
            <Text style={styles.cardText}>Usage: {promo.usage_count}/{promo.usage_limit || '∞'}</Text>
            <Text style={styles.cardText}>Valid: {new Date(promo.valid_from).toLocaleDateString()} - {new Date(promo.valid_until).toLocaleDateString()}</Text>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditingPromotion(promo)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deletePromotion(promo.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff8c00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'zones' && styles.activeTab]}
          onPress={() => setActiveTab('zones')}
        >
          <Text style={[styles.tabText, activeTab === 'zones' && styles.activeTabText]}>Zones</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pricing' && styles.activeTab]}
          onPress={() => setActiveTab('pricing')}
        >
          <Text style={[styles.tabText, activeTab === 'pricing' && styles.activeTabText]}>Adjustments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'promotions' && styles.activeTab]}
          onPress={() => setActiveTab('promotions')}
        >
          <Text style={[styles.tabText, activeTab === 'promotions' && styles.activeTabText]}>Promotions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
          onPress={() => setActiveTab('logs')}
        >
          <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>Logs</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'logs' ? (
        <DeliveryLogs onBack={() => setActiveTab('zones')} />
      ) : (
        <ScrollView style={styles.content}>
          {activeTab === 'zones' && renderZonesTab()}
          {activeTab === 'pricing' && renderPricingTab()}
          {activeTab === 'promotions' && renderPromotionsTab()}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#ff8c00',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#ff8c00',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  addButton: {
    backgroundColor: '#ff8c00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  formContainer: {
    paddingBottom: 40,
  },
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#ff8c00',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 100,
    maxHeight: 150,
    paddingTop: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ff8c00',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#ff8c00',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  radioGroup: {
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ff8c00',
    marginRight: 8,
  },
  radioSelected: {
    backgroundColor: '#ff8c00',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
    textTransform: 'capitalize',
  },
  saveButton: {
    backgroundColor: '#ff8c00',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
