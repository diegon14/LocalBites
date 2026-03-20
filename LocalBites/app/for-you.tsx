import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

// Shape of each restaurant returned by /for-you
type Restaurant = {
  name: string;
  cuisine: string;
  distance_miles: number;
  price_range: number;
  lat: number;
  lon: number;
};

// Shape of the profile summary returned by /for-you
type Profile = {
  top_cuisine: string | null;
  price: number | null;
  based_on_searches: number;
};

type ForYouResponse = {
  profile: Profile;
  results: Restaurant[];
};

// Maps numeric price back to $ symbols for display
function priceLabel(p: number | null): string {
  if (!p) return "";
  return "$".repeat(Math.min(p, 4));
}

export default function ForYouScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  // "no_history" = 204 from server, "error" = network/other failure
  const [state, setState] = useState<"loading" | "no_history" | "error" | "ready">("loading");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [results, setResults] = useState<Restaurant[]>([]);

  useEffect(() => {
    fetchForYou();
  }, []);

  const fetchForYou = async () => {
    setState("loading");
    try {
      // Get user location so the backend can use a real max_distance_miles
      let maxDistance = 10; // fallback default
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          // Location granted — we just use it to confirm we have permission.
          // The /for-you endpoint derives its own location anchor from history.
          maxDistance = 10;
        }
      } catch (_) {
        // Location unavailable — proceed with default distance
      }

      const response = await fetch("http://127.0.0.1:5000/for-you", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_distance_miles: maxDistance }),
      });

      // 204 = no history yet
      if (response.status === 204) {
        setState("no_history");
        return;
      }

      if (!response.ok) throw new Error("Server error");

      const data: ForYouResponse = await response.json();
      setProfile(data.profile);
      setResults(data.results);
      setState("ready");
    } catch (err) {
      console.error("For You fetch failed:", err);
      setState("error");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Finding your picks…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── No history yet ───────────────────────────────────────────────────────
  if (state === "no_history") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          </View>
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>Nothing to show yet</Text>
            <Text style={styles.emptyBody}>
              Search for a few restaurants first and we'll start building your
              personal recommendations.
            </Text>
            <Pressable onPress={() => router.back()} style={styles.cta}>
              <Text style={styles.ctaText}>Go search</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (state === "error") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          </View>
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>⚠️</Text>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptyBody}>
              Couldn't load your recommendations. Make sure the server is
              running and try again.
            </Text>
            <Pressable onPress={fetchForYou} style={styles.cta}>
              <Text style={styles.ctaText}>Retry</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Ready ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>For You ✨</Text>
          {/* Spacer so title stays centred */}
          <View style={{ width: 64 }} />
        </View>

        {/* Profile summary pill */}
        {profile && (
          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>Based on your searches</Text>
            <Text style={styles.profileText}>
              {[
                profile.top_cuisine
                  ? `${profile.top_cuisine.charAt(0).toUpperCase()}${profile.top_cuisine.slice(1)}`
                  : null,
                profile.price ? priceLabel(profile.price) : null,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </Text>
            <Text style={styles.profileMeta}>
              {profile.based_on_searches} search
              {profile.based_on_searches !== 1 ? "es" : ""} analysed
            </Text>
          </View>
        )}

        {/* Results list */}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {results.length === 0 ? (
            <Text style={styles.muted}>No results found nearby.</Text>
          ) : (
            results.map((item, index) => (
              <View key={index} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTitle}>{item.name}</Text>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.distanceTag}>
                      {item.distance_miles} mi
                    </Text>
                    <Text style={styles.priceSubtext}>
                      {priceLabel(item.price_range)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.resultBody}>{item.cuisine}</Text>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 30,
  },
  muted: { color: "#666", fontSize: 14 },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: { fontSize: 22, fontWeight: "800" },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    width: 64,
  },
  backText: { fontSize: 15, fontWeight: "700", color: "#007AFF" },

  // ── Profile card ──
  profileCard: {
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  profileLabel: {
    color: "#666",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  profileText: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  profileMeta: {
    fontSize: 12,
    color: "#888",
  },

  // ── Result cards (identical to search.tsx) ──
  scrollContent: { paddingBottom: 18 },
  resultCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
    paddingRight: 8,
  },
  distanceTag: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#444",
    overflow: "hidden",
  },
  priceSubtext: {
    fontSize: 12,
    color: "#27ae60",
    fontWeight: "bold",
    marginTop: 4,
  },
  resultBody: {
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
    textTransform: "capitalize",
  },

  // ── Empty / error states ──
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  emptyBody: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  cta: {
    marginTop: 8,
    height: 50,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
