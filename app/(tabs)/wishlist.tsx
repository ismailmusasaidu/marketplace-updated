import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, ShoppingCart, Heart } from 'lucide-react-native';
import { useWishlist } from '@/contexts/WishlistContext';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types/database';
import { cartEvents } from '@/lib/cartEvents';
import { Fonts } from '@/constants/fonts';

export default function WishlistScreen() {
  const { wishlistItems, removeFromWishlist, loading: wishlistLoading } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlistProducts();
  }, [wishlistItems]);

  const fetchWishlistProducts = async () => {
    if (wishlistItems.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const productIds = wishlistItems.map(item => item.product_id);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching wishlist products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    await removeFromWishlist(productId);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to add items to cart');
        return;
      }

      const { data: existingItem, error: fetchError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingItem) {
        const { error: updateError } = await supabase
          .from('carts')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('carts')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity: 1,
          });

        if (insertError) throw insertError;
      }

      cartEvents.emit('cartUpdated');
      alert('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart');
    }
  };

  if (loading || wishlistLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff8c00" />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Heart size={80} color="#e2e8f0" strokeWidth={1.5} />
          <Text style={styles.emptyText}>Your wishlist is empty</Text>
          <Text style={styles.emptySubtext}>
            Add items you love to your wishlist
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <Text style={styles.itemCount}>{products.length} items</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Image
              source={{
                uri: product.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
              }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.productDescription} numberOfLines={2}>
                {product.description}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>₦{product.price.toFixed(2)}</Text>
                <Text style={styles.unit}>per {product.unit}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.addToCartButton}
                  onPress={() => handleAddToCart(product)}
                >
                  <ShoppingCart size={18} color="#ffffff" strokeWidth={2.5} />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFromWishlist(product.id)}
                >
                  <Trash2 size={18} color="#ef4444" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: Fonts.headingBold,
    color: '#1e293b',
    letterSpacing: 0.5,
  },
  itemCount: {
    fontSize: 14,
    fontFamily: Fonts.semiBold,
    color: '#64748b',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: '#475569',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  productCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: '#1e293b',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: '#64748b',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontFamily: Fonts.headingBold,
    color: '#ff8c00',
  },
  unit: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: '#94a3b8',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#ff8c00',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  removeButton: {
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
