/**
 * SecureStorage wrapper around expo-secure-store.
 * Provides a simple get/set/delete API for sensitive data such as auth tokens.
 */

import * as SecureStore from "expo-secure-store";

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};

export const AUTH_TOKEN_KEY = "pilotforms_access_token";
export const REFRESH_TOKEN_KEY = "pilotforms_refresh_token";
export const SESSION_KEY = "pilotforms_session";
