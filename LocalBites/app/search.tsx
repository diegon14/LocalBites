import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import {
  getPreferences,
  resetPreferences,
  type Preferences,
} from "../src/storage/preferences";

import * as Location from "expo-location";

const QUICK_SUGGESTIONS = [
  "Tacos",
  "Sushi",
  "Burgers",
  "Ramen",
  "Pho",
  "Pizza",
  "KBBQ",
  "Boba",
  "Pasta",
  "Wings",
];

const priceMap: Record<string, number> = { $: 1, $$: 2, $$$: 3, $$$$: 4 };

export default function SearchScreen() {
  const router = useRouter();

  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loadingPrefs, settingLoadingPrefs] = useState(true);

  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);

  const [locationName, setLocationName] = useState<string>("Current Location");
  const [coords, setCoords] = useState<{ lat: Number; lng: number } | null>(
    null,
  );

  useEffect(() => {
    async function getInitialLocation() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationName("Location access denied");
        return;
      }

      // Get current position
      let loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });

      // Reverse geocode to get a human-readable location name
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const { street, city, region } = reverseGeocode[0];
        // Display a friendly location name like "Near Campus Dr, Irvine"
        setLocationName(`Near ${street || "current area"}, ${city}`);
      }
    }

    getInitialLocation();
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const p = await getPreferences();
        if (mounted) setPrefs(p);
      } finally {
        if (mounted) settingLoadingPrefs(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const activeCuisineText = useMemo(() => {
    if (!prefs) return "no preferences set";
    const cuisines = prefs.cuisines?.length ? prefs.cuisines.join(", ") : "Any";
    return `${prefs.priceRange} • up to ${prefs.maxDistanceMiles} mi • ${cuisines}`;
  }, [prefs]);

  const runSearch = async (text?: string) => {
    const q = (text ?? query).trim();
    // Ensure we have location and preferences before searching
    if (!q || !coords || !prefs) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: coords.lat,
          lon: coords.lng,
          q: q,
          cuisine: prefs.cuisines?.length ? prefs.cuisines[0] : null,
          max_distance_miles: prefs.maxDistanceMiles,
          price_range: priceMap[prefs.priceRange],
        }),
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      // Update results state with the ranked restaurants from api.py
      setResults(data);

      // Update recent searches locally
      setRecent((prev) => {
        const next = [
          q,
          ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase()),
        ];
        return next.slice(0, 8);
      });
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const onEditPreferences = () => {
    router.push("/personalization");
  };

  if (loadingPrefs) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Loading your preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>LocalBites</Text>

          <Pressable onPress={onEditPreferences} style={styles.prefButton}>
            <Text style={styles.prefButtonText}>Preferences</Text>
          </Pressable>
        </View>

        {/* Pref summary */}
        <View style={styles.prefsCard}>
          <Text style={styles.prefsLabel}>Current filters</Text>
          <Text style={styles.prefsText}>{activeCuisineText}</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tacos, ramen, thai, boba..."
            returnKeyType="search"
            onSubmitEditing={() => runSearch()}
            style={styles.searchInput}
          />
          <Pressable onPress={() => runSearch()} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>

        {/* Location Indicator */}
        <View style={styles.locationContainer}>
          <Text style={styles.locationIcon}>📍</Text>
          <Text style={styles.locationText}>{locationName}</Text>
          <Pressable
            onPress={() => {
              /* Trigger re-fetch logic */
            }}
          >
            <Text style={styles.refreshLink}>Refresh</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Quick suggestions */}
          <Text style={styles.sectionTitle}>Quick picks</Text>
          <View style={styles.chipsWrap}>
            {QUICK_SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => {
                  setQuery(s);
                  runSearch(s);
                }}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {/* Recent searches */}
          {recent.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
                Recent
              </Text>
              <View style={styles.recentWrap}>
                {recent.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => {
                      setQuery(r);
                      runSearch(r);
                    }}
                    style={styles.recentItem}
                  >
                    <Text style={styles.recentText}>{r}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {/* Results */}
          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Results</Text>
          {results.map((item, index) => (
            <View key={index} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>{item.name}</Text>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.distanceTag}>
                    {item.distance_miles} mi
                  </Text>
                  {/* New: Show the price range ($ or $$) returned by the API */}
                  <Text style={styles.priceSubtext}>
                    {"$".repeat(item.price_range)}
                  </Text>
                </View>
              </View>
              <Text style={styles.resultBody}>{item.cuisine}</Text>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  muted: { color: "#666" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: { fontSize: 26, fontWeight: "800" },

  prefButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  prefButtonText: { fontWeight: "700" },

  prefsCard: {
    borderWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  prefsLabel: {
    color: "#666",
    marginBottom: 6,
    fontWeight: "700",
    fontSize: 12,
  },
  prefsText: { fontSize: 14, lineHeight: 20 },

  searchRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  searchButton: {
    borderRadius: 14,
    backgroundColor: "#111",
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: { color: "#fff", fontWeight: "800" },

  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  locationIcon: { marginRight: 6, fontSize: 14 },
  locationText: { flex: 1, color: "#444", fontSize: 13, fontWeight: "600" },
  refreshLink: { color: "#007AFF", fontSize: 13, fontWeight: "700" },

  scrollContent: { paddingBottom: 18 },

  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 10 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipText: { fontWeight: "700" },

  recentWrap: { gap: 10 },
  recentItem: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#fff",
  },
  recentText: { fontWeight: "700" },

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
  priceSubtext: {
    fontSize: 12,
    color: "#27ae60",
    fontWeight: "bold",
    marginTop: 4,
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
  resultBody: {
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
    textTransform: "capitalize",
  },
});
