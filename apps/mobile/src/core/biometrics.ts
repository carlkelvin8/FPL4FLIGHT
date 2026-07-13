/**
 * Biometric Authentication Module
 * 
 * Provides Face ID / Fingerprint authentication for app lock.
 */

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "fpl4flight_biometric_enabled";

/** Check if device supports biometrics */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/** Get available biometric types */
export async function getBiometricType(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "Face ID";
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "Fingerprint";
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return "Iris";
  return "Biometric";
}

/** Authenticate with biometrics */
export async function authenticateWithBiometrics(promptMessage?: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage ?? "Authenticate to access FPL4FLIGHT",
      fallbackLabel: "Use passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}

/** Check if biometric lock is enabled */
export async function isBiometricLockEnabled(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

/** Enable biometric lock */
export async function enableBiometricLock(): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
}

/** Disable biometric lock */
export async function disableBiometricLock(): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "false");
}
