import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { getHasOnboarded } from "../src/storage/preferences";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const value = await getHasOnboarded();
        if (mounted) setHasOnboarded(value);
      } finally {
        if (mounted) setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Prevent flashing wrong route while loading storage
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  // Show personalization once, then go to search
  return hasOnboarded ? (
    <Redirect href="/search" />
  ) : (
    <Redirect href="/personalization" />
  );
}
