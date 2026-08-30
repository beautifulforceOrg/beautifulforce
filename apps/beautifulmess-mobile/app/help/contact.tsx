import { useState } from "react";
import { Linking, StyleSheet, Text, TextInput } from "react-native";
import { Button, useTheme } from "@storeforge/ui-native";
import { Screen } from "../../components/screen";
import { apiClient } from "../../lib/api-client";

const ADDRESS = "102, Railway Parallel Road, 6th Cross, Kumara Park West, Bengaluru, Karnataka 560020";

// Real contact info transcribed from apps/beautifulmess/app/help/contact/page.tsx.
// The map embed and mailto:/tel: links there don't have a mobile-native
// equivalent worth building (Linking.openURL for tel:/mailto: covers the
// same "let the user reach us" job); the contact form below hits the
// exact same lib/contact-submission.ts core the web form does.
export default function ContactScreen() {
  const theme = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setStatus("submitting");
    try {
      await apiClient.submitContactMessage({ name, email, phone: phone || undefined, comment });
      setStatus("sent");
      setName("");
      setEmail("");
      setPhone("");
      setComment("");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const textStyle = { color: theme.colorForeground, fontFamily: theme.fontSans };
  const inputStyle = [styles.input, { borderColor: theme.colorBorder, color: theme.colorForeground }];

  return (
    <Screen>
      <Text style={[styles.title, { color: theme.colorForeground, fontFamily: theme.fontHeading ?? theme.fontSans }]}>
        Welcome to our flagship store
      </Text>
      <Text style={textStyle}>{ADDRESS}</Text>
      <Text style={textStyle} onPress={() => Linking.openURL("tel:+918088339455")}>
        Queries & helpline: +91 8088339455
      </Text>
      <Text style={textStyle} onPress={() => Linking.openURL("mailto:online.beautifulmess@gmail.com")}>
        Email: online.beautifulmess@gmail.com
      </Text>
      <Text style={textStyle}>Customer service: 12 PM to 5 PM · Saturday / Sunday Holiday</Text>
      <Text style={textStyle}>Flagship store timings: 12 PM to 7 PM · Sunday Holiday</Text>

      <Text style={[styles.heading, { color: theme.colorForeground, fontFamily: theme.fontSans }]}>Any queries or feedback</Text>
      {status === "sent" ? (
        <Text style={textStyle}>Thanks for reaching out! We&apos;ll get back to you soon.</Text>
      ) : (
        <>
          <TextInput placeholder="Name" value={name} onChangeText={setName} style={inputStyle} />
          <TextInput
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={inputStyle}
          />
          <TextInput placeholder="Phone (optional)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} style={inputStyle} />
          <TextInput
            placeholder="Message"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            style={[inputStyle, styles.textarea]}
          />
          {error ? <Text style={{ color: "#B91C1C" }}>{error}</Text> : null}
          <Button label={status === "submitting" ? "Sending..." : "Send"} onPress={handleSubmit} disabled={status === "submitting"} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: "700" },
  heading: { fontSize: 17, fontWeight: "700", marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  textarea: { minHeight: 100, textAlignVertical: "top" },
});
