import { Stack } from "expo-router";

/** Auth stack — login, register, MFA screens. */
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
