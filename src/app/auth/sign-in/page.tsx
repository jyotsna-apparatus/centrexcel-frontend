"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RedirectIfAuthenticated } from "@/components/redirect-if-authenticated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { setTokens } from "@/lib/auth";
import { type LoginResponse, login } from "@/lib/auth-api";
import { getPostAuthHomePath } from "@/lib/post-auth-home";
import { FIELD_ERROR_INPUT_CLASS } from "@/lib/utils";
import { validateEmail } from "@/lib/validate";

type LoginFormData = {
  email: string;
  password: string;
};

const defaultCredentials = {
  email: "admin@hackathon.com",
  password: "Admin@123",
};

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>(defaultCredentials);
  const [emailError, setEmailError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      if ("needsEmailVerification" in data && data.needsEmailVerification) {
        toast.success(
          data.message ?? "Check your email for the verification code.",
        );
        router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}`);
        return;
      }
      const ok = data as LoginResponse;
      setTokens(ok.data.accessToken, ok.data.refreshToken);
      toast.success("Login successful");
      router.push(getPostAuthHomePath(ok.data.user));
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Login failed");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailError(null);
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message ?? "Invalid email");
      toast.error(emailValidation.message ?? "Please enter a valid email");
      return;
    }
    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <RedirectIfAuthenticated>
      <div className="parent h-dvh">
        <div className="container flex flex-col items-center justify-center gap-6">
          <div className="card flex flex-col items-center justify-center gap-6">
            <Image
              src="/logo-full.svg"
              alt="Centrexcel"
              width={200}
              height={39}
              className="h-9 w-auto"
              priority
            />
            <div className="my-6 flex flex-col items-center justify-center gap-3">
              <h1 className="h3">Login</h1>
              <p className="p1 text-center leading-relaxed">
                Enter your email and password to login
              </p>
            </div>
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-5"
            >
              <Input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setEmailError(null);
                }}
                required
                aria-invalid={!!emailError}
                className={emailError ? FIELD_ERROR_INPUT_CLASS : ""}
              />
              {emailError && (
                <p className="text-sm !text-red-500">{emailError}</p>
              )}
              <div className="flex w-full flex-col gap-2">
                <PasswordInput
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <Link
                  href="/auth/forgot-password"
                  className="link-highlight w-full pl-3"
                >
                  Forgot Password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in…" : "Login"}
              </Button>
            </form>
          </div>
          <p className="p1">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="link-highlight text-base!">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </RedirectIfAuthenticated>
  );
};

export default LoginPage;
