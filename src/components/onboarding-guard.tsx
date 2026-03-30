"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/");
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.isOnboarded === true && isOnboardingPath(pathname)) {
      router.replace("/dashboard");
      return;
    }
    if (user.isOnboarded !== true && !isOnboardingPath(pathname)) {
      router.replace("/onboarding");
    }
  }, [user, pathname, router]);

  if (!user) {
    return <>{children}</>;
  }

  if (user.isOnboarded !== true && !isOnboardingPath(pathname)) {
    return (
      <div className="flex w-full h-[calc(100dvh-4rem)] items-center justify-center">
        <div className="text-cs-text p1">
          Redirecting to complete your profile…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
