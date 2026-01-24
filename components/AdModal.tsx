import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface Advert {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  action_text?: string;
  action_url?: string;
}

interface AdModalProps {
  visible: boolean;
  advert: Advert | null;
  onClose: () => void;
}

export default function AdModal({ visible, advert, onClose }: AdModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!advert) return null;

  const handleAction = async () => {
    if (advert.action_url) {
      try {
        let url = advert.action_url.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = `https://${url}`;
        }
        await Linking.openURL(url);
      } catch (error) {
        console.error('Error opening URL:', error);
      }
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeButtonInner}>
              <X size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>

          {advert.image_url && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: advert.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={styles.imageGradient}
              />
            </View>
          )}

          <View style={styles.content}>
            <View style={styles.sparkleContainer}>
              <Sparkles size={24} color="#ff8c00" />
            </View>

            <Text style={styles.title}>{advert.title}</Text>
            <Text style={styles.description}>{advert.description}</Text>

            {advert.action_text && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleAction}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ff8c00', '#ff6b00']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionButtonGradient}
                >
                  <Text style={styles.actionButtonText}>{advert.action_text}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.dismissButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    width: '100%',
    maxWidth: 500,
    maxHeight: height * 0.85,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
      },
      android: {
        elevation: 20,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeButtonInner: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 24,
    padding: 10,
    backdropFilter: 'blur(10px)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  content: {
    padding: 28,
    paddingTop: 24,
  },
  sparkleContainer: {
    alignSelf: 'center',
    backgroundColor: '#fff3e6',
    borderRadius: 50,
    padding: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#ff8c00',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        shadowColor: '#ff8c00',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
    }),
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 26,
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '400',
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#ff8c00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: '#ff8c00',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
    }),
  },
  actionButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  dismissButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 15,
    color: '#9ca3af',
    fontWeight: '500',
  },
});
