import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  HAS_ONBOARDED: "localbites_has_onboarded",
  PREFS: "localbites_preferences",
};

export type Preferences = {
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  maxDistanceMiles: number;
  cuisines: string[];
};

export async function getHasOnboarded(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.HAS_ONBOARDED);
  return raw === "true";
}

export async function setHasOnboarded(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.HAS_ONBOARDED, String(value));
}

export async function getPreferences(): Promise<Preferences | null> {
  const raw = await AsyncStorage.getItem(KEYS.PREFS);
  return raw ? (JSON.parse(raw) as Preferences) : null;
}

export async function setPreferences(prefs: Preferences): Promise<void> {
  await AsyncStorage.setItem(KEYS.PREFS, JSON.stringify(prefs));
}

// DEV RESET
export async function resetPreferences(): Promise<void> {
  await AsyncStorage.removeItem("localbites_has_onboarded");
  await AsyncStorage.removeItem("localbites_preferences");
}
