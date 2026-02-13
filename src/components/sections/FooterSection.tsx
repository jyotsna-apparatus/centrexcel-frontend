import Image from "next/image";
import Link from "next/link";

const productLinks = [
  { label: "Features", href: "/features" },
  { label: "How it works", href: "/how-it-works" },
  { label: "Hackathons", href: "/hackathons" },
];

const companyLinks = [
  { label: "About", href: "#" },
  { label: "Contact", href: "#" },
];

const legalLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

const FooterSection = () => {
  return (
    <footer className="parent border-t border-cs-border py-12 bg-cs-card">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row flex-wrap gap-10 md:gap-12 pb-8">
          <div className="flex flex-col gap-3 min-w-[200px]">
            <Link href="/">
              <Image
                src="/logo-full.svg"
                alt="CentreExcel"
                width={160}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <p className="p1 text-sm max-w-xs">
              Where hackathons meet opportunity. Build, compete, and launch your
              career.
            </p>
          </div>
          <div>
            <p className="font-semibold text-cs-heading mb-3">Product</p>
            <ul className="flex flex-col gap-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="p1 text-sm link-highlight hover:opacity-90"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-cs-heading mb-3">Company</p>
            <ul className="flex flex-col gap-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="p1 text-sm link-highlight hover:opacity-90"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-cs-heading mb-3">Legal</p>
            <ul className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="p1 text-sm link-highlight hover:opacity-90"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-6 border-t border-cs-border">
          <p className="p1 text-sm text-cs-text">
            © {new Date().getFullYear()} CentreExcel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
