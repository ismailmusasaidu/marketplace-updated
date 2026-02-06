import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, Modal, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, Mail, Phone, LogOut, Shield, Edit, Save, X, Store, MapPin, FileText, Wallet, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import WalletManagement from '@/components/WalletManagement';
import VendorSettings from '@/components/vendor/VendorSettings';
import { useToast } from '@/contexts/ToastContext';
import { Fonts } from '@/constants/fonts';

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showVendorSettings, setShowVendorSettings] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [showSignOutConfirmation, setShowSignOutConfirmation] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [businessName, setBusinessName] = useState(profile?.business_name || '');
  const [businessDescription, setBusinessDescription] = useState(profile?.business_description || '');
  const [businessAddress, setBusinessAddress] = useState(profile?.business_address || '');
  const [businessPhone, setBusinessPhone] = useState(profile?.business_phone || '');

  useEffect(() => {
    if (profile) {
      fetchWalletBalance();
    }
  }, [profile]);

  const fetchWalletBalance = async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', profile.id)
        .maybeSingle();
      if (error) throw error;
      setWalletBalance(data?.wallet_balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const confirmSignOut = () => {
    setShowSignOutConfirmation(true);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Failed to sign out. Please try again.', 'error');
      setSigningOut(false);
      setShowSignOutConfirmation(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    if (!fullName.trim()) {
      showToast('Full name is required', 'warning');
      return;
    }

    if (!email.trim()) {
      showToast('Email is required', 'warning');
      return;
    }

    if (profile.role === 'vendor' && !businessName.trim()) {
      showToast('Business name is required for vendors', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const emailChanged = email.trim() !== profile.email;

      if (emailChanged) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email.trim(),
        });

        if (authError) throw authError;
      }

      const updates: any = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (profile.role === 'vendor') {
        updates.business_name = businessName.trim();
        updates.business_description = businessDescription.trim() || null;
        updates.business_address = businessAddress.trim() || null;
        updates.business_phone = businessPhone.trim() || null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);

      if (error) throw error;

      if (emailChanged) {
        showToast('Profile updated! Please check your new email address to confirm the change.', 'success');
      } else {
        showToast('Profile updated successfully!', 'success');
      }
      setIsEditing(false);

      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(profile?.full_name || '');
    setEmail(profile?.email || '');
    setPhone(profile?.phone || '');
    setBusinessName(profile?.business_name || '');
    setBusinessDescription(profile?.business_description || '');
    setBusinessAddress(profile?.business_address || '');
    setBusinessPhone(profile?.business_phone || '');
    setIsEditing(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#ef4444';
      case 'vendor':
        return '#ff8c00';
      case 'customer':
        return '#ff8c00';
      default:
        return '#6b7280';
    }
  };

  if (showWallet) {
    return (
      <View style={styles.container}>
        <View style={[styles.walletHeader, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setShowWallet(false);
              fetchWalletBalance();
            }}
          >
            <Text style={styles.backButtonText}>← Back to Profile</Text>
          </TouchableOpacity>
        </View>
        <WalletManagement />
      </View>
    );
  }

  if (showVendorSettings) {
    return (
      <View style={styles.container}>
        <View style={[styles.walletHeader, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowVendorSettings(false)}
          >
            <Text style={styles.backButtonText}>← Back to Profile</Text>
          </TouchableOpacity>
        </View>
        <VendorSettings />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.avatarContainer}>
          <User size={48} color="#ffffff" />
        </View>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <View style={styles.roleBadge}>
          <Shield size={14} color="#ffffff" />
          <Text style={styles.roleText}>
            {profile?.role.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.editButtonContainer}>
          {!isEditing ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(true)}
            >
              <Edit size={18} color="#ffffff" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isSaving}
              >
                <X size={18} color="#6b7280" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={isSaving}
              >
                <Save size={18} color="#ffffff" />
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Personal Information</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <User size={20} color="#ff8c00" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9ca3af"
                />
              ) : (
                <Text style={styles.infoValue}>{profile?.full_name}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Mail size={20} color="#ff8c00" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.infoValue}>{profile?.email}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Phone size={20} color="#ff8c00" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.infoValue}>{profile?.phone || 'Not provided'}</Text>
              )}
            </View>
          </View>
        </View>

        {profile?.role === 'vendor' && (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Store Information</Text>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Store size={20} color="#ff8c00" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Business Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                      value={businessName}
                      onChangeText={setBusinessName}
                      placeholder="Enter business name"
                      placeholderTextColor="#9ca3af"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile?.business_name || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <Phone size={20} color="#ff8c00" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Business Phone</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                      value={businessPhone}
                      onChangeText={setBusinessPhone}
                      placeholder="Enter business phone"
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile?.business_phone || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <MapPin size={20} color="#ff8c00" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Business Address</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, styles.textArea, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                      value={businessAddress}
                      onChangeText={setBusinessAddress}
                      placeholder="Enter business address"
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={2}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile?.business_address || 'Not provided'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <FileText size={20} color="#ff8c00" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Business Description</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, styles.textArea, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                      value={businessDescription}
                      onChangeText={setBusinessDescription}
                      placeholder="Describe your business"
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{profile?.business_description || 'Not provided'}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vendor Settings</Text>
              <TouchableOpacity
                style={styles.settingsCard}
                onPress={() => setShowVendorSettings(true)}
              >
                <View style={styles.settingsCardContent}>
                  <View style={styles.settingsIconContainer}>
                    <Settings size={24} color="#ff8c00" />
                  </View>
                  <View style={styles.settingsInfo}>
                    <Text style={styles.settingsLabel}>Store Settings</Text>
                    <Text style={styles.settingsDescription}>
                      Manage delivery, payments, hours & more
                    </Text>
                  </View>
                </View>
                <Text style={styles.settingsArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Wallet</Text>
          <TouchableOpacity
            style={styles.walletCard}
            onPress={() => setShowWallet(true)}
          >
            <View style={styles.walletCardContent}>
              <View style={styles.walletIconContainer}>
                <Wallet size={24} color="#ff8c00" />
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Wallet Balance</Text>
                <Text style={styles.walletAmount}>₦{walletBalance.toFixed(2)}</Text>
              </View>
            </View>
            <Text style={styles.walletArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/help-center')}
          >
            <Text style={styles.menuText}>Help Center</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/terms-of-service')}
          >
            <Text style={styles.menuText}>Terms of Service</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/privacy-policy')}
          >
            <Text style={styles.menuText}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View>
          <TouchableOpacity style={styles.signOutButton} onPress={confirmSignOut}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showSignOutConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <View style={styles.confirmationIcon}>
              <LogOut size={32} color="#ef4444" />
            </View>
            <Text style={styles.confirmationTitle}>Sign Out</Text>
            <Text style={styles.confirmationMessage}>
              Are you sure you want to sign out?
            </Text>
            <View style={styles.confirmationButtons}>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.cancelButton]}
                onPress={() => setShowSignOutConfirmation(false)}
                disabled={signingOut}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmationButton, styles.signOutConfirmButton]}
                onPress={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.signOutConfirmButtonText}>Sign Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#faf8f5',
  },
  header: {
    backgroundColor: '#ff8c00',
    paddingHorizontal: 20,
    paddingBottom: 48,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  name: {
    fontSize: 28,
    fontFamily: Fonts.displayBold,
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  roleText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  content: {
    padding: 16,
  },
  editButtonContainer: {
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff8c00',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e8e0d8',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0ebe4',
  },
  cardTitle: {
    fontSize: 19,
    fontFamily: Fonts.display,
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0ea',
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: Fonts.semiBold,
    color: '#999',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#1a1a1a',
  },
  input: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#1a1a1a',
    backgroundColor: '#faf8f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8e0d8',
    marginTop: 4,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0ebe4',
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: Fonts.display,
    color: '#1a1a1a',
    marginBottom: 14,
  },
  menuItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#faf8f5',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0ebe4',
  },
  menuText: {
    fontSize: 15,
    fontFamily: Fonts.medium,
    color: '#1a1a1a',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    gap: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 32,
  },
  signOutText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#ef4444',
  },
  walletHeader: {
    backgroundColor: '#ff8c00',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: Fonts.semiBold,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#f0ebe4',
  },
  walletCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  walletIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0ebe4',
  },
  walletInfo: {
    justifyContent: 'center',
  },
  walletLabel: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    color: '#92400e',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  walletAmount: {
    fontSize: 26,
    fontFamily: Fonts.displayBold,
    color: '#c2410c',
  },
  walletArrow: {
    fontSize: 22,
    fontFamily: Fonts.medium,
    color: '#c2410c',
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#f0ebe4',
  },
  settingsCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  settingsIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0ebe4',
  },
  settingsInfo: {
    justifyContent: 'center',
    flex: 1,
  },
  settingsLabel: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#92400e',
    marginBottom: 4,
  },
  settingsDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#92400e',
    opacity: 0.7,
  },
  settingsArrow: {
    fontSize: 22,
    fontFamily: Fonts.medium,
    color: '#c2410c',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#f0ebe4',
  },
  confirmationIcon: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 22,
    fontFamily: Fonts.displayBold,
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmationMessage: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: '#64748b',
  },
  signOutConfirmButton: {
    backgroundColor: '#ef4444',
  },
  signOutConfirmButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: '#ffffff',
  },
});
