import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { UserRole } from '@/types/database';
import { Fonts } from '@/constants/fonts';

export default function RegisterScreen() {
  const [accountType, setAccountType] = useState<UserRole>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (accountType === 'vendor') {
      if (!businessName || !businessAddress || !businessPhone) {
        setError('Please fill in all business information');
        return;
      }
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const profileData: any = {
          id: authData.user.id,
          email,
          full_name: fullName,
          phone: phone || null,
          role: accountType,
          vendor_status: accountType === 'vendor' ? 'pending' : 'approved',
        };

        if (accountType === 'vendor') {
          profileData.business_name = businessName;
          profileData.business_description = businessDescription || null;
          profileData.business_address = businessAddress;
          profileData.business_phone = businessPhone;
          profileData.business_license = businessLicense || null;
        }

        const { error: profileError } = await supabase.from('profiles').insert(profileData);

        if (profileError) throw profileError;

        await new Promise(resolve => setTimeout(resolve, 500));

        if (accountType === 'vendor') {
          setError('');
          router.replace('/auth/vendor-pending');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#ff8c00', '#0284c7', '#0369a1']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the marketplace today</Text>

          <View style={styles.form}>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.accountTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  accountType === 'customer' && styles.accountTypeButtonActive,
                ]}
                onPress={() => setAccountType('customer')}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    accountType === 'customer' && styles.accountTypeTextActive,
                  ]}
                >
                  Customer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  accountType === 'vendor' && styles.accountTypeButtonActive,
                ]}
                onPress={() => setAccountType('vendor')}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    accountType === 'vendor' && styles.accountTypeTextActive,
                  ]}
                >
                  Vendor
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Personal Information</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor="#86efac"
              value={fullName}
              onChangeText={setFullName}
            />

            <TextInput
              style={styles.input}
              placeholder="Email *"
              placeholderTextColor="#86efac"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor="#86efac"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Password *"
              placeholderTextColor="#86efac"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TextInput
              style={styles.input}
              placeholder="Confirm Password *"
              placeholderTextColor="#86efac"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {accountType === 'vendor' && (
              <>
                <Text style={styles.sectionTitle}>Business Information</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Business Name *"
                  placeholderTextColor="#86efac"
                  value={businessName}
                  onChangeText={setBusinessName}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Business Description"
                  placeholderTextColor="#86efac"
                  value={businessDescription}
                  onChangeText={setBusinessDescription}
                  multiline
                  numberOfLines={3}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Business Address *"
                  placeholderTextColor="#86efac"
                  value={businessAddress}
                  onChangeText={setBusinessAddress}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Business Phone *"
                  placeholderTextColor="#86efac"
                  value={businessPhone}
                  onChangeText={setBusinessPhone}
                  keyboardType="phone-pad"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Business License Number"
                  placeholderTextColor="#86efac"
                  value={businessLicense}
                  onChangeText={setBusinessLicense}
                />

                <Text style={styles.note}>
                  * Your vendor account will be reviewed by our admin team before activation
                </Text>
              </>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0369a1" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 38,
    fontFamily: Fonts.headingBold,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: Fonts.medium,
    color: '#e0f2fe',
    marginBottom: 36,
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  accountTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  accountTypeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  accountTypeButtonActive: {
    backgroundColor: '#ffffff',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  accountTypeText: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: '#e0f2fe',
  },
  accountTypeTextActive: {
    color: '#0369a1',
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: Fonts.bold,
    color: '#ffffff',
    marginBottom: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#0369a1',
    borderWidth: 3,
    borderColor: '#ff8c00',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    outlineStyle: 'none',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  note: {
    fontSize: 12,
    color: '#fef3c7',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#0369a1',
    fontSize: 19,
    fontFamily: Fonts.headingBold,
    letterSpacing: 0.5,
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    color: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#e0f2fe',
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  link: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: Fonts.bold,
    textDecorationLine: 'underline',
  },
});
