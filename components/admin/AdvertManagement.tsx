import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/contexts/ToastContext';

interface Advert {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  action_text?: string;
  action_url?: string;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
  display_frequency: 'once' | 'daily' | 'always';
  priority: number;
  created_at: string;
}

export default function AdvertManagement() {
  const { showToast } = useToast();
  const [adverts, setAdverts] = useState<Advert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdvert, setEditingAdvert] = useState<Advert | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    action_text: '',
    action_url: '',
    is_active: true,
    start_date: '',
    end_date: '',
    display_frequency: 'daily' as 'once' | 'daily' | 'always',
    priority: 0,
  });

  useEffect(() => {
    fetchAdverts();
  }, []);

  const fetchAdverts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('adverts')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;
      setAdverts(data || []);
    } catch (error: any) {
      showToast(error.message || 'Error fetching adverts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAdvert(null);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      action_text: '',
      action_url: '',
      is_active: true,
      start_date: '',
      end_date: '',
      display_frequency: 'daily',
      priority: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (advert: Advert) => {
    setEditingAdvert(advert);
    setFormData({
      title: advert.title,
      description: advert.description,
      image_url: advert.image_url || '',
      action_text: advert.action_text || '',
      action_url: advert.action_url || '',
      is_active: advert.is_active,
      start_date: advert.start_date || '',
      end_date: advert.end_date || '',
      display_frequency: advert.display_frequency,
      priority: advert.priority,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast('Please fill in title and description', 'error');
      return;
    }

    try {
      const advertData = {
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url || null,
        action_text: formData.action_text || null,
        action_url: formData.action_url || null,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        display_frequency: formData.display_frequency,
        priority: formData.priority,
      };

      if (editingAdvert) {
        const { error } = await supabase
          .from('adverts')
          .update(advertData)
          .eq('id', editingAdvert.id);

        if (error) throw error;
        showToast('Advert updated successfully', 'success');
      } else {
        const { error } = await supabase.from('adverts').insert([advertData]);

        if (error) throw error;
        showToast('Advert created successfully', 'success');
      }

      setShowModal(false);
      fetchAdverts();
    } catch (error: any) {
      showToast(error.message || 'Error saving advert', 'error');
    }
  };

  const handleDelete = async (advertId: string) => {
    Alert.alert(
      'Delete Advert',
      'Are you sure you want to delete this advert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('adverts').delete().eq('id', advertId);

              if (error) throw error;
              showToast('Advert deleted successfully', 'success');
              fetchAdverts();
            } catch (error: any) {
              showToast(error.message || 'Error deleting advert', 'error');
            }
          },
        },
      ]
    );
  };

  const toggleActive = async (advert: Advert) => {
    try {
      const { error } = await supabase
        .from('adverts')
        .update({ is_active: !advert.is_active })
        .eq('id', advert.id);

      if (error) throw error;
      showToast(
        `Advert ${!advert.is_active ? 'activated' : 'deactivated'} successfully`,
        'success'
      );
      fetchAdverts();
    } catch (error: any) {
      showToast(error.message || 'Error updating advert', 'error');
    }
  };

  const renderAdvert = ({ item }: { item: Advert }) => (
    <View style={styles.advertCard}>
      <View style={styles.advertHeader}>
        <View style={styles.advertTitleRow}>
          <Text style={styles.advertTitle}>{item.title}</Text>
          <View style={[styles.badge, item.is_active ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={styles.badgeText}>{item.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
        <Text style={styles.advertDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.advertDetails}>
        <Text style={styles.detailText}>Frequency: {item.display_frequency}</Text>
        <Text style={styles.detailText}>Priority: {item.priority}</Text>
      </View>

      <View style={styles.advertActions}>
        <TouchableOpacity
          style={[styles.toggleButton, item.is_active ? styles.deactivateButton : styles.activateButton]}
          onPress={() => toggleActive(item)}
        >
          <Text style={styles.toggleButtonText}>
            {item.is_active ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => openEditModal(item)}>
          <Edit size={20} color="#3b82f6" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.id)}>
          <Trash2 size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff8c00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Advert Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Plus size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Advert</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={adverts}
        keyExtractor={(item) => item.id}
        renderItem={renderAdvert}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ImageIcon size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No adverts yet</Text>
            <Text style={styles.emptySubtext}>Create your first advert to get started</Text>
          </View>
        }
      />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingAdvert ? 'Edit Advert' : 'Create New Advert'}
              </Text>

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter advert title"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Enter advert description"
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>Image URL</Text>
              <TextInput
                style={styles.input}
                value={formData.image_url}
                onChangeText={(text) => setFormData({ ...formData, image_url: text })}
                placeholder="https://example.com/image.jpg"
              />

              <Text style={styles.label}>Action Button Text</Text>
              <TextInput
                style={styles.input}
                value={formData.action_text}
                onChangeText={(text) => setFormData({ ...formData, action_text: text })}
                placeholder="e.g., Shop Now"
              />

              <Text style={styles.label}>Action URL</Text>
              <TextInput
                style={styles.input}
                value={formData.action_url}
                onChangeText={(text) => setFormData({ ...formData, action_url: text })}
                placeholder="https://example.com"
              />

              <Text style={styles.label}>Display Frequency</Text>
              <View style={styles.frequencyContainer}>
                {['once', 'daily', 'always'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      formData.display_frequency === freq && styles.frequencyButtonActive,
                    ]}
                    onPress={() =>
                      setFormData({ ...formData, display_frequency: freq as any })
                    }
                  >
                    <Text
                      style={[
                        styles.frequencyButtonText,
                        formData.display_frequency === freq && styles.frequencyButtonTextActive,
                      ]}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Priority</Text>
              <TextInput
                style={styles.input}
                value={String(formData.priority)}
                onChangeText={(text) =>
                  setFormData({ ...formData, priority: parseInt(text) || 0 })
                }
                placeholder="0"
                keyboardType="numeric"
              />

              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={formData.is_active}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                  trackColor={{ false: '#d1d5db', true: '#ff8c00' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff8c00',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 20,
  },
  advertCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  advertHeader: {
    marginBottom: 12,
  },
  advertTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  advertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  advertDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: '#d1fae5',
  },
  badgeInactive: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  advertDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  advertActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#10b981',
  },
  deactivateButton: {
    backgroundColor: '#6b7280',
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: '#ff8c00',
    borderColor: '#ff8c00',
  },
  frequencyButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  frequencyButtonTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#ff8c00',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
