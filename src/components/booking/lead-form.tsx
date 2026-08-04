"use client";

import { useActionState } from "react";

import { submitLead, type LeadState } from "@/app/(site)/actions";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/primitives";
import { useT } from "@/components/i18n/locale-provider";

/**
 * Flow A — "call me" (§6).
 *
 * Deliberately separate from the booking flow. Submitting this holds nothing;
 * the copy says so, because a customer who believes their dress is reserved
 * when it is not is the worst outcome this site can produce.
 */
export function LeadForm({
  branchId,
  productId,
  defaultNote,
}: {
  branchId?: string;
  productId?: string;
  defaultNote?: string;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<LeadState, FormData>(
    submitLead,
    { status: "idle" },
  );

  if (state.status === "sent") {
    return (
      <div
        role="status"
        className="border-l-2 border-success bg-success-soft px-5 py-5"
      >
        <p className="font-display text-xl text-ink">{t("form.sentTitle")}</p>
        <p className="mt-2 text-sm leading-relaxed text-graphite">
          {t("form.sentBody")}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="w-full" noValidate>
      {state.status === "error" ? (
        <div className="mb-6">
          <ErrorState title={t("form.errorTitle")} body={state.error} />
        </div>
      ) : null}

      {branchId ? <input type="hidden" name="branchId" value={branchId} /> : null}
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}

      <div className="flex flex-col gap-6">
        <Field label={t("form.fullName")} htmlFor="lead-name" required>
          <Input id="lead-name" name="name" autoComplete="name" required />
        </Field>

        <Field
          label={t("form.mobileNumber")}
          htmlFor="lead-phone"
          required
          hint={t("form.mobileHint")}
        >
          <Input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="010 1234 5678"
            required
            aria-describedby="lead-phone-hint"
          />
        </Field>

        <Field label={t("form.message")} htmlFor="lead-note">
          <Textarea
            id="lead-note"
            name="note"
            defaultValue={defaultNote}
            maxLength={2000}
            placeholder={t("form.messagePlaceholder")}
          />
        </Field>
      </div>

      <Button type="submit" size="lg" variant="secondary" className="mt-8" disabled={pending}>
        {pending ? t("form.sending") : t("form.requestCall")}
      </Button>

      <p className="mt-4 text-xs leading-relaxed text-mist">
        {t("form.doesNotReserve")}
      </p>
    </form>
  );
}
