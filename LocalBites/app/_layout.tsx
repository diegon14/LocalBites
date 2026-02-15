import React from "react";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      {/* index.tsx decides which screen to route to */}
      <Stack.Screen name="index" />
      {/* Personalization / onboarding */}
      <Stack.Screen
        name="personalization"
        options={{
          gestureEnabled: false,
        }}
      />
      {/* Main screen */}
      <Stack.Screen
        name="search"
        options={{
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
