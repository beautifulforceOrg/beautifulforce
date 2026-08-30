import { StyleSheet, Text } from "react-native";
import { useTheme } from "@storeforge/ui-native";
import { Screen } from "./screen";

export interface StaticSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

// Renders the same static legal/informational copy the web app's
// about/help/policies pages hardcode -- these pages have no data layer
// on either platform, so this is a plain content renderer, not an API
// consumer.
export function StaticPage({ title, sections }: { title: string; sections: StaticSection[] }) {
  const theme = useTheme();
  return (
    <Screen>
      <Text style={[styles.title, { color: theme.colorForeground, fontFamily: theme.fontHeading ?? theme.fontSans }]}>{title}</Text>
      {sections.map((section, index) => (
        <SectionBlock key={index} section={section} />
      ))}
    </Screen>
  );
}

function SectionBlock({ section }: { section: StaticSection }) {
  const theme = useTheme();
  return (
    <>
      {section.heading ? (
        <Text style={[styles.heading, { color: theme.colorForeground, fontFamily: theme.fontSans }]}>{section.heading}</Text>
      ) : null}
      {section.paragraphs?.map((paragraph, index) => (
        <Text key={index} style={[styles.body, { color: theme.colorForeground, fontFamily: theme.fontSans }]}>
          {paragraph}
        </Text>
      ))}
      {section.bullets?.map((bullet, index) => (
        <Text key={index} style={[styles.body, styles.bullet, { color: theme.colorForeground, fontFamily: theme.fontSans }]}>
          {"• "}
          {bullet}
        </Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700" },
  heading: { fontSize: 17, fontWeight: "700", marginTop: 8 },
  body: { fontSize: 15, lineHeight: 22 },
  bullet: { marginLeft: 8 },
});
