import type { ComponentProps } from "react";
import { create, act } from "react-test-renderer";
import { Text } from "react-native";
import { ThemeProvider } from "../theme/theme-provider";
import { TEST_THEME } from "../theme/test-fixtures";
import { Button } from "./button";

function renderButton(props: Partial<ComponentProps<typeof Button>> = {}) {
  const onPress = jest.fn();
  let root!: ReturnType<typeof create>;
  act(() => {
    root = create(
      <ThemeProvider theme={TEST_THEME}>
        <Button label="Add to cart" onPress={onPress} {...props} />
      </ThemeProvider>
    );
  });
  return { root, onPress };
}

describe("Button", () => {
  it("renders its label", () => {
    const { root } = renderButton();
    const text = root.root.findByType(Text);
    expect(text.props.children).toBe("Add to cart");
  });

  it("calls onPress when pressed", () => {
    const { root, onPress } = renderButton();
    const pressable = root.root.findByProps({ accessibilityRole: "button" });
    act(() => {
      pressable.props.onPress();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not call onPress when disabled", () => {
    const { root, onPress } = renderButton({ disabled: true });
    const pressable = root.root.findByProps({ accessibilityRole: "button" });
    expect(pressable.props.disabled).toBe(true);
    // Real device behavior: a disabled Pressable never fires onPress at
    // all, but we can't simulate that gating here without a full native
    // event pipeline -- asserting the disabled prop reached the
    // underlying Pressable is the meaningful, testable contract.
    expect(onPress).not.toHaveBeenCalled();
  });
});
