"use client";
import Image from "next/image";
import { Button } from "../ui/button";
import Link from "next/link";
import { MenuIcon, X } from "lucide-react";
import { useState } from "react";

const SiteHeader = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Features",
      href: "/features",
    },
    {
      label: "How It Works",
      href: "/how-it-works",
    },
    {
      label: "Hackathons",
      href: "/hackathons",
    },
    {
      label: "FAQs",
      href: "/faqs",
    },
    {
      label: "Sign In",
      href: "/auth/sign-in",
    },
    {
      label: "Sign Up",
      href: "/auth/sign-up",
    },
  ];

  return (
    <>
      <header className="parent py-4 border-b border-cs-border fixed top-0 left-0 right-0 z-50 glass">
        <div className="container flex flex-wrap items-center justify-between gap-4">
          <Link href="/" data-aos="fade-down">
            <Image
              src="/logo-full.svg"
              alt="Centrexcel"
              width={180}
              height={35}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-3">
            <Button size="sm" asChild data-aos="fade-down" data-aos-delay="100">
              <Link href="/auth/sign-in">Get Started</Link>
            </Button>
            <button
              className="p-2 rounded-md hover:bg-cs-card border border-cs-border"
              onClick={() => setIsOpen(true)}
              data-aos="fade-down"
              data-aos-delay="200"
            >
              <MenuIcon className="size-6" />
            </button>
          </nav>
        </div>
      </header>

      <nav
        className={`h-screen w-screen fixed top-0 left-0 bg-cs-card z-50 p-8 transition parent ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="conatiner relative">
          <button
            className="p-2 rounded-md hover:bg-cs-card border border-cs-border absolute top-8 right-8 "
            onClick={() => setIsOpen(false)}
          >
            <X className="size-6" />
          </button>

          <div className="flex"></div>
        </div>
      </nav>
    </>
  );
};

export default SiteHeader;
