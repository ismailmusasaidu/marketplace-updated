import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Product, Category } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { cartEvents } from '@/lib/cartEvents';
import ProductDetailModal from '@/components/ProductDetailModal';
import ProductCard from '@/components/ProductCard';
import AdModal from '@/components/AdModal';

interface Advert {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  action_text?: string;
  action_url?: string;
  display_frequency: 'once' | 'daily' | 'always';
  priority: number;
}

const PAGE_SIZE = 16;

export default function CustomerHome() {
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAdvert, setCurrentAdvert] = useState<Advert | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);

  useEffect(() => {
    fetchCategories();
    checkAndShowAdvert();

    // Subscribe to real-time product updates (ratings, stock, etc.)
    const subscription = supabase
      .channel('products_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          setProducts((prev) =>
            prev.map((product) =>
              product.id === payload.new.id ? (payload.new as Product) : product
            )
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setProducts([]);
    setPage(0);
    setHasMore(true);
    fetchProducts(0, true);
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (pageNum: number = 0, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_available', true)
        .gt('stock_quantity', 0);

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newProducts = data || [];

      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }

      setHasMore(newProducts.length === PAGE_SIZE && (count ? (from + PAGE_SIZE) < count : true));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const checkAndShowAdvert = async () => {
    try {
      // Fetch active adverts
      const { data: adverts, error } = await supabase
        .from('adverts')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error || !adverts || adverts.length === 0) return;

      // Get the highest priority advert
      const advert = adverts[0] as Advert;

      // Check if we should show this advert based on frequency
      const shouldShow = await shouldShowAdvert(advert);

      if (shouldShow) {
        setCurrentAdvert(advert);
        // Delay showing the modal slightly to avoid showing during initial load
        setTimeout(() => setShowAdModal(true), 1000);
        await markAdvertAsShown(advert);
      }
    } catch (error) {
      console.error('Error checking adverts:', error);
    }
  };

  const shouldShowAdvert = async (advert: Advert): Promise<boolean> => {
    const storageKey = `advert_shown_${advert.id}`;

    if (advert.display_frequency === 'always') {
      return true;
    }

    const lastShownStr = await AsyncStorage.getItem(storageKey);

    if (!lastShownStr && advert.display_frequency === 'once') {
      return true;
    }

    if (advert.display_frequency === 'daily' && lastShownStr) {
      const lastShown = new Date(lastShownStr);
      const now = new Date();
      const hoursSinceShown = (now.getTime() - lastShown.getTime()) / (1000 * 60 * 60);
      return hoursSinceShown >= 24;
    }

    if (!lastShownStr && advert.display_frequency === 'daily') {
      return true;
    }

    return false;
  };

  const markAdvertAsShown = async (advert: Advert) => {
    const storageKey = `advert_shown_${advert.id}`;
    await AsyncStorage.setItem(storageKey, new Date().toISOString());
  };

  const closeAdModal = () => {
    setShowAdModal(false);
    setCurrentAdvert(null);
  };

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const closeProductDetail = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const addToCart = async (productId: string, e?: any) => {
    if (e) {
      e.stopPropagation();
    }
    if (!profile) return;

    try {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('carts')
        .select('id, quantity')
        .eq('user_id', profile.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        // Update existing item by incrementing quantity
        const { error } = await supabase
          .from('carts')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('carts')
          .insert({
            user_id: profile.id,
            product_id: productId,
            quantity: 1,
          });

        if (error) throw error;
      }

      // Emit cart event to update badge
      cartEvents.emit();
    } catch (error: any) {
      console.error('Error adding to cart:', error);
    }
  };

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.greeting}>Hello, {profile?.full_name || 'Guest'}</Text>
        <Text style={styles.subtitle}>What would you like to order today?</Text>

        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.categoriesWrapper}>
        <View style={styles.categoriesContent}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff8c00" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productList}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.row}
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#ff8c00" />
                <Text style={styles.loadingText}>Loading more products...</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => (
            <View style={styles.cardWrapper}>
              <ProductCard
                product={item}
                onPress={() => openProductDetail(item)}
                onAddToCart={(e) => addToCart(item.id, e)}
              />
            </View>
          )}
        />
      )}

      <ProductDetailModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={closeProductDetail}
      />

      <AdModal
        visible={showAdModal}
        advert={currentAdvert}
        onClose={closeAdModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ff8c00',
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#e0f2fe',
    marginBottom: 20,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#ff8c00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
    borderWidth: 0,
    outlineWidth: 0,
  },
  categoriesWrapper: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  categoriesContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryChipActive: {
    backgroundColor: '#ff8c00',
    shadowColor: '#ff8c00',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productList: {
    padding: 12,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  cardWrapper: {
    flex: 1,
    maxWidth: '50%',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
});
