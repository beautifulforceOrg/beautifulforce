import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, TextInput } from "react-native";
import { Button, useTheme } from "@storeforge/ui-native";
import { Screen } from "../../components/screen";
import { apiClient } from "../../lib/api-client";

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogIn() {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiClient.logIn(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Incorrect email or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const textStyle = { color: theme.colorForeground, fontFamily: theme.fontSans };
  const inputStyle = { borderWidth: 1, borderRadius: 8, borderColor: theme.colorBorder, color: theme.colorForeground, padding: 12 };

  return (
    <Screen>
      <TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={inputStyle} />
      <TextInput placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} style={inputStyle} />
      {error ? <Text style={{ color: "#B91C1C" }}>{error}</Text> : null}
      <Button label={isSubmitting ? "Logging in..." : "Log in"} onPress={handleLogIn} disabled={isSubmitting} />
      <Link href="/account/signup">
        <Text style={textStyle}>Don&apos;t have an account? Sign up</Text>
      </Link>
    </Screen>
  );
}
