import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";

import { setHasOnboarded, setPreferences } from "../src/storage/preferences";

const CUISINES = [
  "Mexican",
  "Italian",
  "Japanese",
  "Korean",
  "Chinese",
  "Thai",
  "Vietnamese",
  "Indian",
  "Mediterranean",
  "American",
];

type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export default function PersonalizationScreen() {
  const router = useRouter();

  const [priceRange, setPriceRange] = useState<PriceRange>("$$");
  const [distanceMiles, setDistanceMiles] = useState<number>(5);
  const [selectedCusisines, setSelectedCuisines] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const canContinue = useMemo(
    () => selectedCusisines.length >= 0 && !saving,
    [selectedCusisines, saving],
  );

  const toggleCuisine = (cuisine: string) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine],
    );
  };

  const onGetStarted = async () => {
    if (!canContinue) return;

    try {
      setSaving(true);

      await setPreferences({
        priceRange,
        maxDistanceMiles: distanceMiles,
        cuisines: selectedCusisines,
      });

      await setHasOnboarded(true);

      // Replace prevents going "back" to onboarding
      router.replace("/search");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Personalize LocalBites</Text>
        <Text style={styles.subtitle}>
          Set your default filters. You can change these later anytime.
        </Text>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/*Price */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price range</Text>
            <View style={styles.row}>
              {(["$", "$$", "$$$", "$$$$"] as PriceRange[]).map((p) => {
                const active = p === priceRange;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setPriceRange(p)}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text
                      style={[styles.pillText, active && styles.pillTextActive]}
                    >
                      {p}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Max distance</Text>
            <Text style={styles.helper}>{distanceMiles.toFixed(0)} miles</Text>

            <View style={styles.sliderWrap}>
              <Slider
                minimumValue={1}
                maximumValue={25}
                step={1}
                value={distanceMiles}
                onValueChange={setDistanceMiles}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.muted}>1</Text>
                <Text style={styles.helper}>25</Text>
              </View>
            </View>
          </View>

          {/* Cuisine */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuisines</Text>
            {/* <Text style={styles.helper}>Pick at least one</Text> */}

            <View style={styles.chipsWrap}>
              {CUISINES.map((c) => {
                const active = selectedCusisines.includes(c);
                return (
                  <Pressable
                    key={c}
                    onPress={() => toggleCuisine(c)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>

        {/* Bottom button */}
        <View style={styles.bottomBar}>
          <Pressable
            onPress={onGetStarted}
            disabled={!canContinue}
            style={[styles.cta, !canContinue && styles.ctaDisabled]}
          >
            <Text style={styles.ctaText}>
              {saving ? "Saving..." : "Get Started"}{" "}
            </Text>
          </Pressable>

          {!canContinue && selectedCusisines.length === 0 && (
            <Text style={styles.bottomHint}>
              Select at least 1 cuisine to continue.
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { marginTop: 8, color: "#555", fontSize: 14, lineHeight: 20 },

  scrollContent: { paddingTop: 18, paddingBottom: 20 },

  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  helper: { color: "#666", marginBottom: 10 },

  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },

  pill: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  pillActive: { backgroundColor: "#111", borderColor: "#111" },
  pillText: { color: "#111", fontWeight: "600" },
  pillTextActive: { color: "#fff" },

  sliderWrap: {
    borderWidth: 1,
    borderColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: "#fafafa",
  },
  sliderLabels: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  muted: { color: "#777", fontSize: 12 },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#111", borderColor: "#111" },
  chipText: { color: "#111", fontWeight: "600" },
  chipTextActive: { color: "#fff" },

  bottomBar: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 16,
  },
  cta: {
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111",
  },
  ctaDisabled: { opacity: 0.4 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  bottomHint: {
    marginTop: 10,
    color: "#666",
    fontSize: 13,
    textAlign: "center",
  },
});
