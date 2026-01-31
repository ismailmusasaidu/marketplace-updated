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
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Sparkles, Star, TrendingUp, Gift, Zap } from 'lucide-react-native';
import { Fonts } from '@/constants/fonts';

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
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  console.log('🎭 AdModal render - visible:', visible, 'advert:', advert?.title);

  useEffect(() => {
    if (visible) {
      console.log('🎬 AdModal animations starting...');
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

      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      sparkleAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [visible]);

  if (!advert) {
    console.log('⚠️ AdModal: No advert provided, returning null');
    return null;
  }

  console.log('✅ AdModal: Rendering modal with advert:', advert.title);
  console.log('📱 Platform:', Platform.OS);
  console.log('🎨 Opacity animation value:', opacityAnim);
  console.log('📏 Scale animation value:', scaleAnim);

  const handleAction = async () => {
    if (advert.action_url) {
      try {
        let url = advert.action_url.trim();

        if (!url) {
          Alert.alert('Error', 'No URL provided');
          return;
        }

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = `https://${url}`;
        }

        const canOpen = await Linking.canOpenURL(url);
        if (!canOpen) {
          Alert.alert('Invalid Link', 'This link cannot be opened. Please check the URL.');
          return;
        }

        await Linking.openURL(url);
        onClose();
      } catch (error: any) {
        console.error('Error opening URL:', error);
        Alert.alert(
          'Failed to Open Link',
          error?.message || 'Unable to open this link. Please try again later.'
        );
      }
    } else {
      onClose();
    }
  };

  const sparkleRotation = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.decorativeCornerTopLeft} />
          <View style={styles.decorativeCornerTopRight} />
          <View style={styles.decorativeCornerBottomLeft} />
          <View style={styles.decorativeCornerBottomRight} />

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <View style={styles.closeButtonInner}>
              <X size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>

          <View style={styles.hotBadge}>
            <LinearGradient
              colors={['#ff4757', '#ff6348']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hotBadgeGradient}
            >
              <Zap size={14} color="#ffffff" fill="#ffffff" />
              <Text style={styles.hotBadgeText}>HOT DEAL</Text>
            </LinearGradient>
          </View>

          <View style={styles.scrollWrapper}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {advert.image_url && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: advert.image_url }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.6)']}
                    style={styles.imageGradient}
                  />
                  <View style={styles.imageBadgeContainer}>
                    <View style={styles.imageBadge}>
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.imageBadgeText}>Featured</Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.content}>
                <Animated.View
                  style={[
                    styles.sparkleContainer,
                    {
                      transform: [{ rotate: sparkleRotation }],
                      opacity: sparkleOpacity,
                    },
                  ]}
                >
                  <Sparkles size={28} color="#ff8c00" />
                </Animated.View>

                <View style={styles.trendingBadge}>
                  <TrendingUp size={16} color="#10b981" />
                  <Text style={styles.trendingText}>Trending Now</Text>
                </View>

                <Text style={styles.title}>{advert.title}</Text>
                <Text style={styles.description}>{advert.description}</Text>

                <View style={styles.offerHighlight}>
                  <Gift size={20} color="#ff8c00" />
                  <Text style={styles.offerText}>Limited Time Offer</Text>
                </View>

                {advert.action_url && (
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={handleAction}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#ff8c00', '#ff6b00', '#ff5500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.actionButtonGradient}
                      >
                        <Text style={styles.actionButtonText}>
                          {advert.action_text || 'Shop Now'}
                        </Text>
                        <View style={styles.actionButtonArrow}>
                          <Text style={styles.actionButtonArrowText}>→</Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                )}

                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dismissButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 32,
    width: '90%',
    maxWidth: 520,
    maxHeight: height * 0.85,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 140, 0, 0.2)',
    ...Platform.select({
      ios: {
        shadowColor: '#ff8c00',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
      },
      android: {
        elevation: 25,
      },
      web: {
        shadowColor: '#ff8c00',
        shadowOffset: { width: 0, height: 25 },
        shadowOpacity: 0.5,
        shadowRadius: 40,
      },
    }),
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  decorativeCornerTopLeft: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 60,
    height: 60,
    borderTopLeftRadius: 32,
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: '#ff8c00',
    zIndex: 1,
  },
  decorativeCornerTopRight: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 60,
    height: 60,
    borderTopRightRadius: 32,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: '#ff8c00',
    zIndex: 1,
  },
  decorativeCornerBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 60,
    height: 60,
    borderBottomLeftRadius: 32,
    borderLeftWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#ff8c00',
    zIndex: 1,
  },
  decorativeCornerBottomRight: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 60,
    height: 60,
    borderBottomRightRadius: 32,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: '#ff8c00',
    zIndex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 10,
  },
  closeButtonInner: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 28,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
    }),
  },
  hotBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#ff4757',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        shadowColor: '#ff4757',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
    }),
  },
  hotBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  hotBadgeText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
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
    height: 120,
  },
  imageBadgeContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  imageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
    }),
  },
  imageBadgeText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#111827',
  },
  content: {
    padding: 20,
    paddingTop: 20,
    backgroundColor: '#ffffff',
  },
  sparkleContainer: {
    alignSelf: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 60,
    padding: 16,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#ffedd5',
    ...Platform.select({
      ios: {
        shadowColor: '#ff8c00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        shadowColor: '#ff8c00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
    }),
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 16,
  },
  trendingText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    color: '#059669',
  },
  title: {
    fontSize: 24,
    fontFamily: Fonts.headingBold,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  description: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: '#6b7280',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  offerHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 10,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  offerText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: '#c2410c',
    letterSpacing: 0.3,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#ff8c00',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        shadowColor: '#ff8c00',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
    }),
  },
  actionButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  actionButtonArrow: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonArrowText: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: '#ffffff',
  },
  dismissButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: '#9ca3af',
  },
});
