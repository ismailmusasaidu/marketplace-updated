import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Star, ShoppingCart, Heart } from 'lucide-react-native';
import { Product, ProductImage } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useWishlist } from '@/contexts/WishlistContext';
import { Fonts } from '@/constants/fonts';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAddToCart: (e: any) => void;
}

export default function ProductCard({ product, onPress, onAddToCart }: ProductCardProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    fetchProductImages();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (images.length > 1) {
      startAutoSlide();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [images]);

  const fetchProductImages = async () => {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .order('display_order');

      if (error) {
        console.error('Error fetching product images:', error);
        return;
      }
      if (data && data.length > 0) {
        setImages(data);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
    }
  };

  const startAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 2000);
  };

  const displayImages = images.length > 0 ? images : [{
    id: 'default',
    image_url: product.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
    display_order: 0,
    is_primary: true,
    product_id: product.id,
    created_at: ''
  }];

  const isValidImageUrl = (url: string) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://');
  };

  const currentImageUrl = displayImages[currentImageIndex]?.image_url;
  const isValidUrl = isValidImageUrl(currentImageUrl);
  const fallbackUrl = product.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';

  const hasFailed = failedImages.has(currentImageUrl);
  const finalImageUrl = (hasFailed || !isValidUrl) ? fallbackUrl : currentImageUrl;

  const inWishlist = isInWishlist(product.id);

  const handleWishlistToggle = (e: any) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <View style={styles.productCard}>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: finalImageUrl }}
            style={styles.productImage}
            onError={(e) => {
              console.error('Image load error for:', currentImageUrl);
              setFailedImages(prev => new Set(prev).add(currentImageUrl));
            }}
          />

          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={handleWishlistToggle}
          >
            <Heart
              size={22}
              color={inWishlist ? '#ff8c00' : '#ffffff'}
              fill={inWishlist ? '#ff8c00' : 'none'}
              strokeWidth={2.5}
            />
          </TouchableOpacity>

          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    currentImageIndex === index && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.ratingContainer}>
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.rating}>{product.rating.toFixed(1)}</Text>
          </View>
          <View style={styles.productFooter}>
            <View>
              <Text style={styles.price}>₦{product.price.toFixed(2)}</Text>
              <Text style={styles.unit}>per {product.unit}</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAddToCart}
            >
              <ShoppingCart size={18} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 6,
    overflow: 'hidden',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  imageSlider: {
    flexDirection: 'row',
    width: '100%',
    height: 180,
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#e2e8f0',
    resizeMode: 'cover',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  dotActive: {
    backgroundColor: '#ffffff',
    width: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  productInfo: {
    padding: 14,
  },
  productName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: '#1e293b',
    marginBottom: 6,
    height: 38,
    letterSpacing: 0.2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rating: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    color: '#92400e',
    marginLeft: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontFamily: Fonts.headingBold,
    color: '#ff8c00',
    letterSpacing: 0.3,
  },
  unit: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#ff8c00',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
});
