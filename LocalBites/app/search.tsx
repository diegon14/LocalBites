import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { resetPreferences } from "../src/storage/preferences";

export default function SearchScreen() {
  const router = useRouter();

  const handleReset = async () => {
    await resetPreferences();

    // Navigate back to personalization
    router.replace("/personalization");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SearchScreen</Text>

      {/* TEMP DEV BUTTON */}
      <Pressable style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetText}>Reset onboarding</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: "red",
    padding: 12,
    borderRadius: 8,
  },
  resetText: {
    color: "white",
    fontWeight: "bold",
  },
});
