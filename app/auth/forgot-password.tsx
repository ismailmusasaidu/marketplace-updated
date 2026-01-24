import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <LinearGradient
        colors={['#ff8c00', '#ff6b00', '#ff4500']}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.successContainer}>
            <View style={styles.iconContainer}>
              <Mail size={64} color="#ffffff" strokeWidth={2} />
            </View>

            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to {email}
            </Text>
            <Text style={styles.successSubtext}>
              Please check your email and click the link to reset your password
            </Text>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.replace('/auth/login')}
            >
              <Text style={styles.backButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#ff8c00', '#ff6b00', '#ff4500']}
      style={styles.container}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.backLinkText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password
        </Text>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#ffa366"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoFocus
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ff8c00" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  backLinkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: '#ffe4cc',
    marginBottom: 36,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
    paddingHorizontal: 16,
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
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    fontSize: 16,
    color: '#cc5500',
    fontWeight: '600',
    borderWidth: 3,
    borderColor: '#ff8c00',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    outlineStyle: 'none',
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
    color: '#ff8c00',
    fontSize: 19,
    fontWeight: '800',
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
    color: '#ffe4cc',
    fontSize: 15,
    fontWeight: '500',
  },
  link: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  successContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 28,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  successMessage: {
    fontSize: 16,
    color: '#ffe4cc',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 24,
  },
  successSubtext: {
    fontSize: 14,
    color: '#ffe4cc',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  backButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonText: {
    color: '#ff8c00',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
