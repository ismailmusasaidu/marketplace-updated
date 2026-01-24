import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Fonts } from '@/constants/fonts';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, profile } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);

      // Wait a bit for profile to load via onAuthStateChange
      await new Promise(resolve => setTimeout(resolve, 500));

      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Danhausa Marketplace</Text>
        <Text style={styles.subtitle}>Sign in to continue shopping</Text>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#ffb366"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#ffb366"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Link href="/auth/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 38,
    fontFamily: Fonts.headingBold,
    color: '#ff8c00',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: Fonts.medium,
    color: '#ff8c00',
    marginBottom: 36,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 28,
    borderWidth: 2,
    borderColor: '#ff8c00',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: '#ff8c00',
    borderWidth: 2,
    borderColor: '#ff8c00',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    outlineStyle: 'none',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#ff8c00',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#ff8c00',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#ffffff',
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
    color: '#ff8c00',
    fontSize: 15,
    fontFamily: Fonts.medium,
  },
  link: {
    color: '#ff8c00',
    fontSize: 15,
    fontFamily: Fonts.bold,
    textDecorationLine: 'underline',
  },
});
