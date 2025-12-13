import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { db, auth } from "../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { colors, spacing } from "../config/theme";

type SosItem = {
  id: string;
  createdAt?: { seconds: number; nanoseconds: number };
  method: string;
  riskLevel?: string;
  riskScore?: number;
  aiSummary?: string;
  status?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
};

export default function HistoryScreen() {
  const [items, setItems] = useState<SosItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const ref = collection(db, "sosRequests");
    const q = query(
      ref,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const result: SosItem[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          result.push({
            id: docSnap.id,
            createdAt: data.createdAt,
            method: data.method,
            riskLevel: data.riskLevel,
            riskScore: data.riskScore,
            aiSummary: data.aiSummary,
            status: data.status,
            location: data.location,
          });
        });
        setItems(result);
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsub();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    // The snapshot listener will update automatically
  };

  const formatDate = (seconds: number) => {
    const date = new Date(seconds * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "button": return "🟢";
      case "shake": return "📱";
      case "voice": return "🎤";
      case "geofence": return "📍";
      case "secret": return "🕵️";
      case "fall": return "⬇️";
      case "inactivity": return "⏸️";
      case "power": return "🔘";
      default: return "🚨";
    }
  };

  const renderItem = ({ item }: { item: SosItem }) => {
    const dateStr = item.createdAt?.seconds 
      ? formatDate(item.createdAt.seconds)
      : "Unknown time";

    const riskLevel = item.riskLevel || "UNKNOWN";
    const riskScore = item.riskScore ?? "-";
    const methodIcon = getMethodIcon(item.method);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.methodContainer}>
            <Text style={styles.methodIcon}>{methodIcon}</Text>
            <Text style={styles.methodText}>
              {item.method.toUpperCase()}
            </Text>
          </View>
          <View style={[
            styles.riskBadge, 
            { backgroundColor: riskStyles[riskLevel]?.backgroundColor || colors.textSecondary }
          ]}>
            <Text style={styles.riskBadgeText}>
              {riskLevel} ({riskScore})
            </Text>
          </View>
        </View>
        
        <Text style={styles.dateText}>{dateStr}</Text>
        
        {item.location && (
          <Text style={styles.locationText}>
            📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
          </Text>
        )}
        
        {item.aiSummary && (
          <Text style={styles.summaryText} numberOfLines={2}>
            {item.aiSummary}
          </Text>
        )}
        
        {item.status && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={[
              styles.statusValue,
              item.status === "ACTIVE" ? styles.statusActive : styles.statusInactive
            ]}>
              {item.status}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading your SOS history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SOS History</Text>
        <Text style={styles.subtitle}>
          {items.length} alert{items.length !== 1 ? 's' : ''} triggered
        </Text>
      </View>
      
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>No SOS alerts yet</Text>
            <Text style={styles.emptyText}>
              Your SOS history will appear here when you trigger an emergency alert.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const riskStyles: Record<string, any> = {
  HIGH: { backgroundColor: colors.danger },
  MEDIUM: { backgroundColor: colors.warning },
  LOW: { backgroundColor: colors.success },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.l,
    paddingBottom: spacing.m,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.m,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.s,
  },
  methodContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s,
  },
  methodIcon: {
    fontSize: 16,
  },
  methodText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  riskBadge: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.s,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: spacing.s,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  statusValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusActive: {
    color: colors.success,
  },
  statusInactive: {
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.m,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.s,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});