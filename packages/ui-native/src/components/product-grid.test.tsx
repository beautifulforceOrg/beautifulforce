import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import { ThemeProvider } from "../theme/theme-provider";
import { TEST_THEME } from "../theme/test-fixtures";
import { ProductGrid, type GridProduct } from "./product-grid";

const PRODUCTS: GridProduct[] = [
  { id: "1", name: "Blue Frock", price: 550000 },
  { id: "2", name: "Sling Bag", price: 150000 },
];

describe("ProductGrid", () => {
  it("renders one card per product with the real names", () => {
    let root!: ReturnType<typeof create>;
    act(() => {
      root = create(
        <ThemeProvider theme={TEST_THEME}>
          <ProductGrid products={PRODUCTS} onSelectProduct={jest.fn()} />
        </ThemeProvider>
      );
    });
    const texts = root.root.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toContain("Blue Frock");
    expect(texts).toContain("Sling Bag");
  });

  it("calls onSelectProduct with the tapped product's id", () => {
    const onSelectProduct = jest.fn();
    let root!: ReturnType<typeof create>;
    act(() => {
      root = create(
        <ThemeProvider theme={TEST_THEME}>
          <ProductGrid products={PRODUCTS} onSelectProduct={onSelectProduct} />
        </ThemeProvider>
      );
    });
    // The rendered tree has both the composite Pressable and its
    // underlying host View reporting accessibilityRole "button" -- only
    // the composite instance carries a real onPress function.
    const pressables = root.root
      .findAllByProps({ accessibilityRole: "button" })
      .filter((node) => typeof node.props.onPress === "function");
    act(() => {
      pressables[1]!.props.onPress();
    });
    expect(onSelectProduct).toHaveBeenCalledWith("2");
  });
});
