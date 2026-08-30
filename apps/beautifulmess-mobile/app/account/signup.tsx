import { useState } from "react";
import { Link, useRouter } from "expo-router";
import { Text, TextInput } from "react-native";
import { Button, useTheme } from "@storeforge/ui-native";
import { Screen } from "../../components/screen";
import { apiClient } from "../../lib/api-client";

export default function SignupScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.signUp(email, password, name || undefined);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const textStyle = { color: theme.colorForeground, fontFamily: theme.fontSans };
  const inputStyle = { borderWidth: 1, borderRadius: 8, borderColor: theme.colorBorder, color: theme.colorForeground, padding: 12 };

  return (
    <Screen>
      <TextInput placeholder="Name" value={name} onChangeText={setName} style={inputStyle} />
      <TextInput placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={inputStyle} />
      <TextInput placeholder="Password (min. 8 characters)" secureTextEntry value={password} onChangeText={setPassword} style={inputStyle} />
      {error ? <Text style={{ color: "#B91C1C" }}>{error}</Text> : null}
      <Button label={isSubmitting ? "Creating account..." : "Create account"} onPress={handleSignUp} disabled={isSubmitting} />
      <Link href="/account/login">
        <Text style={textStyle}>Already have an account? Log in</Text>
      </Link>
    </Screen>
  );
}
