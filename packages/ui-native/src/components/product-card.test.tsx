import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import { ThemeProvider } from "../theme/theme-provider";
import { TEST_THEME } from "../theme/test-fixtures";
import { ProductCard } from "./product-card";

describe("ProductCard", () => {
  it("renders the product name and formatted price", () => {
    let root!: ReturnType<typeof create>;
    act(() => {
      root = create(
        <ThemeProvider theme={TEST_THEME}>
          <ProductCard name="Blue Frock" price={550000} onPress={jest.fn()} />
        </ThemeProvider>
      );
    });
    const texts = root.root.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toContain("Blue Frock");
    expect(texts).toContain("₹5,500");
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    let root!: ReturnType<typeof create>;
    act(() => {
      root = create(
        <ThemeProvider theme={TEST_THEME}>
          <ProductCard name="Blue Frock" price={550000} onPress={onPress} />
        </ThemeProvider>
      );
    });
    const pressable = root.root.findByProps({ accessibilityRole: "button" });
    act(() => {
      pressable.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
