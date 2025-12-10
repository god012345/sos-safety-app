import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { db, auth } from "../services/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

type SosItem = {
  id: string;
  createdAt?: { seconds: number; nanoseconds: number };
  method: string;
  riskLevel?: string;
  riskScore?: number;
  aiSummary?: string;
  status?: string;
};

export default function HistoryScreen() {
  const [items, setItems] = useState<SosItem[]>([]);
  const [loading, setLoading] = useState(true);

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
          });
        });
        setItems(result);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const renderItem = ({ item }: { item: SosItem }) => {
    let dateStr = "Unknown time";
    if (item.createdAt?.seconds) {
      const d = new Date(item.createdAt.seconds * 1000);
      dateStr = d.toLocaleString();
    }

    const riskLevel = item.riskLevel || "UNKNOWN";
    const riskScore = item.riskScore ?? "-";

    return (
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.methodText}>
            Method: <Text style={styles.methodBold}>{item.method}</Text>
          </Text>
          <Text style={[styles.riskBadge, riskStyles[riskLevel] || {}]}>
            {riskLevel} ({riskScore})
          </Text>
        </View>
        <Text style={styles.dateText}>{dateStr}</Text>
        {item.status && (
          <Text style={styles.statusText}>Status: {item.status}</Text>
        )}
        {item.aiSummary && (
          <Text style={styles.summaryText}>{item.aiSummary}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading your SOS history...</Text>
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={styles.center}>
        <Text style={{ textAlign: "center", paddingHorizontal: 16 }}>
          You have not triggered any SOS alerts yet.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12 }}
      />
    </View>
  );
}

const riskStyles: Record<string, any> = {
  HIGH: { backgroundColor: "#ff3b30" },
  MEDIUM: { backgroundColor: "#ff9500" },
  LOW: { backgroundColor: "#34c759" },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  methodText: {
    fontSize: 14,
  },
  methodBold: {
    fontWeight: "bold",
  },
  riskBadge: {
    color: "white",
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    overflow: "hidden",
  },
  dateText: {
    marginTop: 4,
    fontSize: 12,
    color: "#555",
  },
  statusText: {
    marginTop: 4,
    fontSize: 13,
    color: "#333",
  },
  summaryText: {
    marginTop: 6,
    fontSize: 13,
    color: "#444",
  },
});
