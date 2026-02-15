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

export default function SearchScreen() {
  const router = useRouter();

  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loadingPrefs, settingLoadingPrefs] = useState(true);

  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

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

  const runSearch = (text?: string) => {
    const q = (text ?? query).trim();
    if (!q) return;

    // Prototype behasvior: store recent searches locally (in-memory)
    setRecent((prev) => {
      const next = [
        q,
        ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase()),
      ];
      return next.slice(0, 8);
    });

    // TODO: hook into ranking / API later
    console.log("Searching for:", q, "with prefs:", prefs);
  };

  const onEditPreferences = () => {
    router.push("/personalization");
  };

  // Dev-only reset
  const onResetOnboarding = async () => {
    await resetPreferences();
    router.replace("/personalization");
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

          {/* Placeholder results */}
          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Results</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Prototype placeholder</Text>
            <Text style={styles.resultBody}>
              Later, ranked restaurant cards will show up here based on:
              {"\n"}• query text
              {"\n"}• selected cuisines
              {"\n"}• price range
              {"\n"}• distance
            </Text>
          </View>

          {/*DEV reset (remove later) */}
          <Pressable onPress={onResetOnboarding} style={styles.devReset}>
            <Text style={styles.devResetText}>DEV: Reset onbarding</Text>
          </Pressable>

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
    padding: 14,
    backgroundColor: "#fff",
  },
  resultTitle: { fontWeight: "900", marginBottom: 8 },
  resultBody: { color: "#444", lineHeight: 20 },

  devReset: {
    marginTop: 18,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "#ffecec",
    borderWidth: 1,
    borderColor: "#ffb3b3",
  },
  devResetText: { color: "#b00000", fontWeight: "900" },
});
