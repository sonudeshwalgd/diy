import AsyncStorage from "@react-native-async-storage/async-storage";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

export const USER_TOKEN_KEY = "diy_user_token_v1";

let fingerprintPromise: ReturnType<typeof FingerprintJS.load> | null = null;
let tokenPromise: Promise<string> | null = null;

async function getBrowserFingerprint() {
  if (!fingerprintPromise) {
    fingerprintPromise = FingerprintJS.load();
  }
  const fp = await fingerprintPromise;
  const result = await fp.get();
  return {
    visitorId: result.visitorId,
    confidence: result.confidence.score,
    version: result.version,
  };
}

async function createUserToken(): Promise<string> {
  if (Platform.OS === "web") {
    try {
      const fingerprint = await getBrowserFingerprint();
      if (fingerprint.visitorId) {
        return `fp_${fingerprint.visitorId}`;
      }
    } catch (error) {
      console.warn("Fingerprint generation failed, using random token", error);
    }
  }
  return `rnd_${Crypto.randomUUID()}`;
}

export async function getUserToken(): Promise<string> {
  if (!tokenPromise) {
    tokenPromise = (async () => {
      const stored = await AsyncStorage.getItem(USER_TOKEN_KEY);
      if (stored) return stored;

      const token = await createUserToken();
      await AsyncStorage.setItem(USER_TOKEN_KEY, token);
      return token;
    })().catch((error) => {
      tokenPromise = null;
      throw error;
    });
  }
  return tokenPromise;
}
