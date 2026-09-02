import { expect, test } from "@playwright/test";

test("customer can sign up, save a wishlist item, and see it on their account page", async ({ page }) => {
  const email = `e2e_${Date.now()}@example.com`;

  await page.goto("/account/signup");
  await page.getByPlaceholder("Name").fill("E2E Shopper");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();

  await page.waitForURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Hi, E2E Shopper" })).toBeVisible();

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page.getByRole("button", { name: "Added to wishlist" })).toBeVisible();

  await page.goto("/account");
  await expect(page.getByText("BEIGE SLEEVELESS 3D FLORAL FROCK")).toBeVisible();

  // Log out, then confirm the account page requires logging back in.
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL("/");
  await page.goto("/account");
  await expect(page).toHaveURL(/\/account\/login$/);

  // Logging back in restores the same saved wishlist item.
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill("correct horse battery");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/account$/);
  await expect(page.getByText("BEIGE SLEEVELESS 3D FLORAL FROCK")).toBeVisible();
});

test("a signed-out visitor is sent to log in when trying to wishlist something", async ({ page }) => {
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("button", { name: "Add to wishlist" }).click();
  await expect(page).toHaveURL(/\/account\/login$/);
});

test("visiting /account/settings while logged out redirects to login", async ({ page }) => {
  await page.goto("/account/settings");
  await expect(page).toHaveURL(/\/account\/login$/);
});

test.describe("account settings", () => {
  async function signUp(page: import("@playwright/test").Page, email: string) {
    await page.goto("/account/signup");
    await page.getByPlaceholder("Email", { exact: true }).fill(email);
    await page.getByPlaceholder(/Password/).fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/account$/);
  }

  test("a customer can change their email and log in with the new one", async ({ page }) => {
    const email = `e2e_settings_${Date.now()}@example.com`;
    const newEmail = `e2e_settings_new_${Date.now()}@example.com`;
    await signUp(page, email);

    await page.goto("/account/settings");
    const emailSection = page.getByRole("region", { name: "Change email" });
    await emailSection.getByPlaceholder("New email").fill(newEmail);
    await emailSection.getByPlaceholder("Current password").fill("correct horse battery");
    await emailSection.getByRole("button", { name: "Update email" }).click();
    await expect(page.getByText("Email updated.")).toBeVisible();

    await page.goto("/account");
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL("/");
    await page.goto("/account/login");
    await page.getByPlaceholder("Email", { exact: true }).fill(newEmail);
    await page.getByPlaceholder("Password", { exact: true }).fill("correct horse battery");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL(/\/account$/);
    await expect(page.getByText(newEmail)).toBeVisible();
  });

  test("changing email with the wrong current password is rejected", async ({ page }) => {
    const email = `e2e_settings_wrongpw_${Date.now()}@example.com`;
    await signUp(page, email);

    await page.goto("/account/settings");
    const emailSection = page.getByRole("region", { name: "Change email" });
    await emailSection.getByPlaceholder("New email").fill("someone-else@example.com");
    await emailSection.getByPlaceholder("Current password").fill("totally wrong password");
    await emailSection.getByRole("button", { name: "Update email" }).click();
    await expect(page.getByText("Current password is incorrect.")).toBeVisible();
  });

  test("a customer can change their password and log in with the new one", async ({ page }) => {
    const email = `e2e_settings_pw_${Date.now()}@example.com`;
    await signUp(page, email);

    await page.goto("/account/settings");
    const passwordSection = page.getByRole("region", { name: "Change password" });
    await passwordSection.getByPlaceholder("Current password").fill("correct horse battery");
    await passwordSection.getByPlaceholder(/New password/).fill("a brand new password");
    await passwordSection.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password updated.")).toBeVisible();

    await page.goto("/account");
    await page.getByRole("button", { name: "Log out" }).click();
    await page.waitForURL("/");
    await page.goto("/account/login");
    await page.getByPlaceholder("Email", { exact: true }).fill(email);
    await page.getByPlaceholder("Password", { exact: true }).fill("a brand new password");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL(/\/account$/);
  });
});

test("a returning customer's checkout address is saved and prefilled next time", async ({ page }) => {
  const email = `e2e_saved_address_${Date.now()}@example.com`;
  await page.goto("/account/signup");
  await page.getByPlaceholder("Email", { exact: true }).fill(email);
  await page.getByPlaceholder(/Password/).fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/account$/);

  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();

  await page.goto("/checkout");
  await page.getByLabel("Full name").fill("Saved Address Test");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone number").fill("9876500001");
  await page.getByLabel("Address", { exact: true }).fill("42 Saved Address Lane");
  await page.getByLabel("Flat, house number, floor, or landmark").fill("Unit 4");
  await page.getByLabel("City").fill("Chennai");
  await page.getByLabel("State").fill("Tamil Nadu");
  await page.getByLabel("Pincode").fill("600001");
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForURL(/\/orders\/.+/);

  // A second order should arrive at checkout with the saved address
  // already selected in the picker (the plain address form is only
  // shown for "Use a new address" -- see app/checkout/page.tsx).
  await page.goto("/products/beige-sleeveless-3d-floral-frock");
  await page.getByRole("radio", { name: "5-6-years" }).click();
  await page.getByRole("button", { name: "Add to cart" }).click();
  await page.goto("/checkout");
  await expect(page.getByText(/Home.*Saved Address Test, 42 Saved Address Lane, Chennai/)).toBeVisible();
  await expect(page.getByLabel("Full name")).not.toBeVisible();
  await page.getByRole("button", { name: "Pay now" }).click();
  await page.waitForURL(/\/orders\/.+/);
});

test.describe("saved address book", () => {
  async function signUp(page: import("@playwright/test").Page, email: string) {
    await page.goto("/account/signup");
    await page.getByPlaceholder("Email", { exact: true }).fill(email);
    await page.getByPlaceholder(/Password/).fill("correct horse battery");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/account$/);
  }

  test("a customer can add, edit, set default, and remove saved addresses", async ({ page }) => {
    const email = `e2e_addresses_${Date.now()}@example.com`;
    await signUp(page, email);

    await page.goto("/account/addresses");
    await expect(page.getByText("No saved addresses yet.")).toBeVisible();

    await page.getByPlaceholder("Label (e.g. Home, Office)").fill("Home");
    await page.getByPlaceholder("Full name").fill("Address Book Test");
    await page.getByPlaceholder("Phone number").fill("9876500010");
    await page.getByPlaceholder("Address", { exact: true }).fill("1 First Address Road");
    await page.getByPlaceholder("City").fill("Bengaluru");
    await page.getByPlaceholder("State").fill("Karnataka");
    await page.getByPlaceholder("Pincode").fill("560001");
    await page.getByRole("button", { name: "Add address" }).click();
    await expect(page.getByText("1 First Address Road")).toBeVisible();
    await expect(page.getByText("Default")).toBeVisible();

    // A second address is not the default automatically.
    await page.getByRole("button", { name: "Add a new address" }).click();
    await page.getByPlaceholder("Label (e.g. Home, Office)").fill("Office");
    await page.getByPlaceholder("Full name").fill("Address Book Test");
    await page.getByPlaceholder("Phone number").fill("9876500011");
    await page.getByPlaceholder("Address", { exact: true }).fill("2 Second Address Road");
    await page.getByPlaceholder("City").fill("Bengaluru");
    await page.getByPlaceholder("State").fill("Karnataka");
    await page.getByPlaceholder("Pincode").fill("560002");
    await page.getByRole("button", { name: "Add address" }).click();
    await expect(page.getByText("2 Second Address Road")).toBeVisible();

    const officeCard = page.locator("li", { hasText: "2 Second Address Road" });
    await officeCard.getByRole("button", { name: "Set as default" }).click();
    await expect(officeCard.getByText("Default")).toBeVisible();

    // Located by its stable label, not the address line -- that changes below.
    const homeCard = page.locator("li").filter({ has: page.getByText("Home", { exact: true }) });
    await homeCard.getByRole("button", { name: "Edit" }).click();
    await page.getByPlaceholder("Address", { exact: true }).fill("1 Edited Address Road");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("1 Edited Address Road")).toBeVisible();

    await homeCard.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("1 Edited Address Road")).toHaveCount(0);
    await expect(officeCard.getByText("Default")).toBeVisible();
  });

  test("checkout shows a picker to choose between multiple saved addresses", async ({ page }) => {
    const email = `e2e_address_picker_${Date.now()}@example.com`;
    await signUp(page, email);

    await page.goto("/account/addresses");
    for (const [label, road] of [
      ["Home", "10 Home Road"],
      ["Office", "20 Office Road"],
    ] as const) {
      await page.getByPlaceholder("Label (e.g. Home, Office)").fill(label);
      await page.getByPlaceholder("Full name").fill("Picker Test");
      await page.getByPlaceholder("Phone number").fill("9876500020");
      await page.getByPlaceholder("Address", { exact: true }).fill(road);
      await page.getByPlaceholder("City").fill("Bengaluru");
      await page.getByPlaceholder("State").fill("Karnataka");
      await page.getByPlaceholder("Pincode").fill("560001");
      await page.getByRole("button", { name: "Add address" }).click();
      await expect(page.getByText(road)).toBeVisible();
      if (label === "Home") await page.getByRole("button", { name: "Add a new address" }).click();
    }

    await page.goto("/products/beige-sleeveless-3d-floral-frock");
    await page.getByRole("radio", { name: "5-6-years" }).click();
    await page.getByRole("button", { name: "Add to cart" }).click();
    await page.goto("/checkout");

    await expect(page.getByText(/Home.*10 Home Road/)).toBeVisible();
    await expect(page.getByText(/Office.*20 Office Road/)).toBeVisible();
    await expect(page.getByRole("radio", { name: /Home.*10 Home Road/ })).toBeChecked();

    await page.getByRole("radio", { name: /Office.*20 Office Road/ }).check();
    await page.getByRole("radio", { name: "Use a new address" }).check();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Full name")).toHaveValue("");
  });
});
