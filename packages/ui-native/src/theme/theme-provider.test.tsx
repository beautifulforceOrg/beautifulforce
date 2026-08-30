import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import { ThemeProvider, useTheme } from "./theme-provider";
import { TEST_THEME } from "./test-fixtures";

function ThemedProbe() {
  const theme = useTheme();
  return <Text>{theme.colorBrand}</Text>;
}

describe("ThemeProvider / useTheme", () => {
  it("makes the injected theme available to descendants", () => {
    let root!: ReturnType<typeof create>;
    act(() => {
      root = create(
        <ThemeProvider theme={TEST_THEME}>
          <ThemedProbe />
        </ThemeProvider>
      );
    });
    const tree = root.toJSON();
    if (Array.isArray(tree) || tree === null) {
      throw new Error("expected a single rendered root");
    }
    expect(tree.children).toEqual(["#C0504D"]);
  });

  it("throws if used outside a ThemeProvider", () => {
    const consoleError = console.error;
    console.error = () => {};
    expect(() => {
      act(() => {
        create(<ThemedProbe />);
      });
    }).toThrow("useTheme must be used within a ThemeProvider");
    console.error = consoleError;
  });
});
