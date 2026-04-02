"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, CreditCard, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/pageHeader/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { canAccessPath } from "@/config/sidebar-nav";
import { useAuth } from "@/contexts/auth-context";
import { createPayment } from "@/lib/auth-api";

const MIN_AMOUNT_RS = 1;
const MAX_AMOUNT_RS = 999999;

function parseAmountRs(raw: string | null): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < MIN_AMOUNT_RS || n > MAX_AMOUNT_RS)
    return null;
  return n;
}

export default function PaymentCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const hackathonId = searchParams.get("hackathonId") ?? undefined;
  const amountParam = searchParams.get("amount");

  const lockedAmountRs = useMemo(() => {
    if (!hackathonId) return null;
    return parseAmountRs(amountParam);
  }, [hackathonId, amountParam]);

  const isEntryFeeCheckout = lockedAmountRs !== null;
  const brokenEntryFeeLink = Boolean(hackathonId) && !isEntryFeeCheckout;

  const [amountRs, setAmountRs] = useState(() => {
    if (hackathonId) return "";
    const n = parseAmountRs(amountParam);
    return n != null ? String(n) : "";
  });

  useEffect(() => {
    if (user?.role && !canAccessPath("/payments/checkout", user.role)) {
      router.replace("/dashboard");
    }
  }, [user?.role, router]);

  const createMutation = useMutation({
    mutationFn: (amountPaisa: number) =>
      createPayment({
        amount: amountPaisa,
        redirectPath: "/payment/return",
        hackathonId,
      }),
    onSuccess: (data) => {
      const url = data?.data?.redirectUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("No redirect URL received");
      }
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to initiate payment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let paisa: number;
    if (isEntryFeeCheckout && lockedAmountRs !== null) {
      paisa = Math.round(lockedAmountRs * 100);
    } else {
      const rs = Number.parseFloat(amountRs);
      if (Number.isNaN(rs) || rs < MIN_AMOUNT_RS || rs > MAX_AMOUNT_RS) {
        toast.error(
          `Enter an amount between ₹${MIN_AMOUNT_RS} and ₹${MAX_AMOUNT_RS}`,
        );
        return;
      }
      paisa = Math.round(rs * 100);
      if (paisa < 100) {
        toast.error("Minimum amount is ₹1 (100 paisa)");
        return;
      }
    }
    createMutation.mutate(paisa);
  };

  const isAdmin = user?.role === "admin";

  if (brokenEntryFeeLink) {
    return (
      <div>
        <PageHeader
          title="Payment link incomplete"
          description="This challenge payment link is missing a valid amount."
        >
          <Button variant="outline" size="sm" asChild>
            <Link
              href={hackathonId ? `/hackathons/${hackathonId}` : "/hackathons"}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to challenge
            </Link>
          </Button>
        </PageHeader>
        <div className="mt-6 max-w-md rounded-lg border border-cs-border bg-card p-6 text-sm text-muted-foreground">
          <p>
            Open the challenge, go to <strong>Apply</strong>, and use{" "}
            <strong>Pay entry fee</strong> from there so the correct amount is
            included.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={
          isEntryFeeCheckout ? "Pay challenge entry fee" : "Pay with PhonePe"
        }
        description={
          isAdmin
            ? "Admins do not make payments here."
            : isEntryFeeCheckout
              ? "The amount is fixed for this challenge. We open PhonePe in the next step so you can pay securely."
              : "Enter an amount, then we send you to PhonePe to complete payment."
        }
      >
        <Button variant="outline" size="sm" asChild>
          <Link
            href={
              isAdmin
                ? "/payments"
                : hackathonId
                  ? `/hackathons/${hackathonId}`
                  : "/dashboard"
            }
          >
            <ArrowLeft className="mr-2 size-4" />
            {isAdmin ? "View transactions" : "Back"}
          </Link>
        </Button>
      </PageHeader>

      {isAdmin ? (
        <div className="mt-6 max-w-md">
          <div className="rounded-lg border border-cs-border bg-card p-6">
            <p className="text-cs-text mb-4">
              Admins do not make payments here. View all transactions on the
              Transactions page.
            </p>
            <Button asChild>
              <Link href="/payments">View all transactions</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 max-w-md space-y-4">
          <div className="rounded-lg border border-cs-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-medium text-cs-heading">
              <CreditCard className="size-5" />
              {isEntryFeeCheckout ? "Entry fee" : "Payment details"}
            </h2>

            <p className="mb-4 text-sm text-muted-foreground">
              {isEntryFeeCheckout
                ? "Your order is created on our server, then you finish payment on PhonePe’s site. That two-step flow is how PhonePe Standard Checkout works—we never collect card or UPI details on this app."
                : "We create a payment request on our server and redirect you to PhonePe to pay securely."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isEntryFeeCheckout && lockedAmountRs !== null ? (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-cs-heading">
                    Amount
                  </p>
                  <div className="flex items-center gap-2 rounded-md border border-cs-border bg-muted/40 px-3 py-2.5 text-base font-medium tabular-nums text-cs-text">
                    <Lock
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span>₹{lockedAmountRs.toFixed(2)}</span>
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      Set by organizer
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="amount"
                    className="mb-1.5 block text-sm font-medium text-cs-heading"
                  >
                    Amount (₹)
                  </label>
                  <Input
                    id="amount"
                    type="number"
                    min={MIN_AMOUNT_RS}
                    max={MAX_AMOUNT_RS}
                    step="0.01"
                    placeholder="e.g. 100"
                    value={amountRs}
                    onChange={(e) => setAmountRs(e.target.value)}
                    disabled={createMutation.isPending}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Minimum ₹{MIN_AMOUNT_RS}. You will be redirected to PhonePe
                    to pay securely.
                  </p>
                </div>
              )}
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending
                  ? "Redirecting to PhonePe..."
                  : isEntryFeeCheckout
                    ? `Pay ₹${lockedAmountRs?.toFixed(2)} with PhonePe`
                    : "Pay with PhonePe"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
