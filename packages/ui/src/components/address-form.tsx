"use client";

import { useEffect, useRef } from "react";

export interface AddressValue {
  name: string;
  email: string;
  phone: string;
  // The Google Places Autocomplete-resolved line (street number + route).
  addressLine1: string;
  // Free text for anything the autocomplete doesn't capture -- flat/house/
  // villa number, floor, building name, a landmark.
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface AddressFormProps {
  value: AddressValue;
  onChange: (value: AddressValue) => void;
  // Without a key, the address line falls back to a plain text input --
  // useful for tests/storybook, and a safe default if a storefront hasn't
  // configured Google Maps yet.
  googleMapsApiKey?: string;
}

interface GoogleAddressComponent {
  long_name: string;
  types: string[];
}
interface GooglePlace {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
}
interface GoogleAutocomplete {
  addListener(event: "place_changed", handler: () => void): void;
  getPlace(): GooglePlace;
}
interface GoogleNamespace {
  maps: { places: { Autocomplete: new (input: HTMLInputElement, opts: Record<string, unknown>) => GoogleAutocomplete } };
}

function getGoogle(): GoogleNamespace | undefined {
  return (window as unknown as { google?: GoogleNamespace }).google;
}

let mapsScriptPromise: Promise<void> | undefined;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (getGoogle()?.maps?.places) {
    return Promise.resolve();
  }
  if (!mapsScriptPromise) {
    mapsScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps"));
      document.head.appendChild(script);
    });
  }
  return mapsScriptPromise;
}

function addressComponent(components: GoogleAddressComponent[], type: string): string {
  return components.find((component) => component.types.includes(type))?.long_name ?? "";
}

const inputClassName =
  "w-full rounded-[var(--sf-radius,0.5rem)] border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted";

export function AddressForm({ value, onChange, googleMapsApiKey }: AddressFormProps) {
  const addressLine1Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!googleMapsApiKey) return;
    let cancelled = false;

    loadGoogleMapsScript(googleMapsApiKey)
      .then(() => {
        const google = getGoogle();
        if (cancelled || !google || !addressLine1Ref.current) return;

        const autocomplete = new google.maps.places.Autocomplete(addressLine1Ref.current, {
          componentRestrictions: { country: "in" },
          fields: ["address_components", "formatted_address"],
          types: ["address"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const components = place.address_components ?? [];
          const streetNumber = addressComponent(components, "street_number");
          const route = addressComponent(components, "route");
          const city =
            addressComponent(components, "locality") ||
            addressComponent(components, "postal_town") ||
            addressComponent(components, "administrative_area_level_2");
          const state = addressComponent(components, "administrative_area_level_1");
          const pincode = addressComponent(components, "postal_code");

          onChange({
            ...value,
            addressLine1: [streetNumber, route].filter(Boolean).join(" ") || place.formatted_address || value.addressLine1,
            city: city || value.city,
            state: state || value.state,
            pincode: pincode || value.pincode,
          });
        });
      })
      .catch(() => {
        // Maps failed to load (network, invalid key, ad blocker) -- the
        // field stays a plain text input, no autocomplete, no crash.
      });

    return () => {
      cancelled = true;
    };
    // Re-running this on every `value`/`onChange` change would re-attach a
    // new Autocomplete instance per keystroke -- only the key matters here.
  }, [googleMapsApiKey]);

  function set<K extends keyof AddressValue>(key: K, next: AddressValue[K]) {
    onChange({ ...value, [key]: next });
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium text-foreground">Shipping address</legend>
      <input
        aria-label="Full name"
        placeholder="Full name"
        value={value.name}
        onChange={(e) => set("name", e.target.value)}
        className={inputClassName}
      />
      <input
        aria-label="Email"
        type="email"
        placeholder="Email"
        value={value.email}
        onChange={(e) => set("email", e.target.value)}
        className={inputClassName}
      />
      <input
        aria-label="Phone number"
        type="tel"
        placeholder="Phone number"
        value={value.phone}
        onChange={(e) => set("phone", e.target.value)}
        className={inputClassName}
      />
      <input
        ref={addressLine1Ref}
        aria-label="Address"
        placeholder={googleMapsApiKey ? "Start typing your address" : "Address"}
        value={value.addressLine1}
        onChange={(e) => set("addressLine1", e.target.value)}
        className={inputClassName}
      />
      <input
        aria-label="Flat, house number, floor, or landmark"
        placeholder="Flat / house no., floor, landmark (optional)"
        value={value.addressLine2}
        onChange={(e) => set("addressLine2", e.target.value)}
        className={inputClassName}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          aria-label="City"
          placeholder="City"
          value={value.city}
          onChange={(e) => set("city", e.target.value)}
          className={inputClassName}
        />
        <input
          aria-label="State"
          placeholder="State"
          value={value.state}
          onChange={(e) => set("state", e.target.value)}
          className={inputClassName}
        />
      </div>
      <input
        aria-label="Pincode"
        placeholder="Pincode"
        value={value.pincode}
        onChange={(e) => set("pincode", e.target.value)}
        className={inputClassName}
      />
    </fieldset>
  );
}
