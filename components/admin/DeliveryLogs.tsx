import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';

interface DeliveryLog {
  id: string;
  user_id: string;
  order_id: string | null;
  address_id: string | null;
  action: string;
  details: any;
  zone_id: string | null;
  distance_km: number | null;
  base_price: number | null;
  distance_price: number | null;
  promotion_discount: number | null;
  adjustment_amount: number | null;
  final_price: number | null;
  created_at: string;
  profiles?: {
    email: string;
  };
}

interface DeliveryLogsProps {
  onBack: () => void;
}

export default function DeliveryLogs({ onBack }: DeliveryLogsProps) {
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_logs')
        .select(`
          *,
          profiles:user_id (email)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setLogs(data);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'calculate':
        return '#2196F3';
      case 'address_saved':
        return '#4CAF50';
      case 'adjustment':
        return '#FF9800';
      case 'promotion_applied':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

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
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Delivery Logs</Text>
        <TouchableOpacity onPress={loadLogs}>
          <Text style={styles.refreshButton}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No delivery logs found</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <TouchableOpacity
                onPress={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
              >
                <View style={styles.logHeader}>
                  <View style={[styles.actionBadge, { backgroundColor: getActionColor(log.action) }]}>
                    <Text style={styles.actionText}>{log.action}</Text>
                  </View>
                  <Text style={styles.timestamp}>{formatDate(log.created_at)}</Text>
                </View>

                <Text style={styles.userEmail}>
                  User: {log.profiles?.email || 'Unknown'}
                </Text>

                <View style={styles.logDetails}>
                  {log.distance_km && (
                    <Text style={styles.detailText}>Distance: {log.distance_km.toFixed(2)} km</Text>
                  )}
                  {log.final_price !== null && (
                    <Text style={styles.priceText}>Final Price: ₦{log.final_price.toFixed(2)}</Text>
                  )}
                </View>

                {expandedLog === log.id && (
                  <View style={styles.expandedDetails}>
                    {log.base_price !== null && (
                      <Text style={styles.detailRow}>Base Price: ₦{log.base_price.toFixed(2)}</Text>
                    )}
                    {log.distance_price !== null && (
                      <Text style={styles.detailRow}>Distance Price: ₦{log.distance_price.toFixed(2)}</Text>
                    )}
                    {log.promotion_discount !== null && log.promotion_discount > 0 && (
                      <Text style={[styles.detailRow, styles.discount]}>
                        Promotion Discount: -₦{log.promotion_discount.toFixed(2)}
                      </Text>
                    )}
                    {log.adjustment_amount !== null && log.adjustment_amount !== 0 && (
                      <Text style={[styles.detailRow, styles.adjustment]}>
                        Adjustment: {log.adjustment_amount > 0 ? '+' : ''}₦{log.adjustment_amount.toFixed(2)}
                      </Text>
                    )}
                    {log.order_id && (
                      <Text style={styles.detailRow}>Order ID: {log.order_id}</Text>
                    )}
                    {log.address_id && (
                      <Text style={styles.detailRow}>Address ID: {log.address_id}</Text>
                    )}
                    {log.zone_id && (
                      <Text style={styles.detailRow}>Zone ID: {log.zone_id}</Text>
                    )}

                    {log.details && (
                      <View style={styles.jsonContainer}>
                        <Text style={styles.jsonTitle}>Full Details:</Text>
                        <Text style={styles.jsonText}>
                          {JSON.stringify(log.details, null, 2)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#ff8c00',
  },
  backButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  refreshButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  logCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  userEmail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  logDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff8c00',
    marginTop: 4,
  },
  expandedDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  detailRow: {
    fontSize: 14,
    color: '#333',
    marginBottom: 6,
  },
  discount: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  adjustment: {
    color: '#FF9800',
    fontWeight: '600',
  },
  jsonContainer: {
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  jsonTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  jsonText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
});
