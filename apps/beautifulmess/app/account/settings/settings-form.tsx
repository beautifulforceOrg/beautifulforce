"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { changeEmail, changePassword } from "../../../lib/account-actions";

export function AccountSettingsForm() {
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [, startEmailTransition] = useTransition();

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [, startPasswordTransition] = useTransition();

  function handleChangeEmail(formData: FormData) {
    setEmailError(null);
    setEmailSuccess(false);
    setIsChangingEmail(true);
    startEmailTransition(() => {
      changeEmail(formData)
        .then((result) => {
          if (result?.error) setEmailError(result.error);
          else setEmailSuccess(true);
        })
        .finally(() => setIsChangingEmail(false));
    });
  }

  function handleChangePassword(formData: FormData) {
    setPasswordError(null);
    setPasswordSuccess(false);
    setIsChangingPassword(true);
    startPasswordTransition(() => {
      changePassword(formData)
        .then((result) => {
          if (result?.error) setPasswordError(result.error);
          else setPasswordSuccess(true);
        })
        .finally(() => setIsChangingPassword(false));
    });
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-heading mb-2 text-3xl text-foreground">Account settings</h1>
      <p className="mb-8 text-sm text-muted">
        <Link href="/account" className="text-brand underline">
          Back to my account
        </Link>
      </p>

      <p className="mb-8 text-sm">
        <Link href="/account/addresses" className="text-brand underline">
          Manage saved addresses
        </Link>
      </p>

      <section aria-label="Change email">
        <h2 className="font-heading mb-4 text-xl text-foreground">Change email</h2>
        <form action={handleChangeEmail} className="space-y-4">
          <input
            type="email"
            name="email"
            required
            placeholder="New email"
            className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
          />
          <input
            type="password"
            name="currentPassword"
            required
            placeholder="Current password"
            className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
          />
          {emailError ? (
            <p style={{ color: "#B91C1C" }} className="text-sm">
              {emailError}
            </p>
          ) : null}
          {emailSuccess ? <p className="text-sm text-brand">Email updated.</p> : null}
          <button
            type="submit"
            disabled={isChangingEmail}
            className="w-full rounded-[var(--sf-radius,0.5rem)] bg-brand py-2.5 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
          >
            {isChangingEmail ? "Saving..." : "Update email"}
          </button>
        </form>
      </section>

      <section aria-label="Change password" className="mt-10 border-t border-border pt-8">
        <h2 className="font-heading mb-4 text-xl text-foreground">Change password</h2>
        <form action={handleChangePassword} className="space-y-4">
          <input
            type="password"
            name="currentPassword"
            required
            placeholder="Current password"
            className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
          />
          <input
            type="password"
            name="newPassword"
            required
            minLength={8}
            placeholder="New password (min. 8 characters)"
            className="w-full rounded-[var(--sf-radius,0.5rem)] border border-border px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted"
          />
          {passwordError ? (
            <p style={{ color: "#B91C1C" }} className="text-sm">
              {passwordError}
            </p>
          ) : null}
          {passwordSuccess ? <p className="text-sm text-brand">Password updated.</p> : null}
          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full rounded-[var(--sf-radius,0.5rem)] bg-brand py-2.5 text-sm font-medium uppercase text-brand-foreground disabled:opacity-50"
          >
            {isChangingPassword ? "Saving..." : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}
