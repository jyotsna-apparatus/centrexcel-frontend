import Image from "next/image";
import Link from "next/link";

const footerSections = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Hackathons", href: "/hackathons" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

const FooterSection = () => {
  return (
    <footer className="parent border-t border-cs-border pt-8 bg-cs-card">
      <div className="container px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {footerSections.map((section) => (
              <div key={section.title}>
                <p className="font-semibold text-cs-heading mb-3">
                  {section.title}
                </p>
                <ul className="flex flex-col gap-2">
                  {section.links.map((link) => (
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
            ))}
          </div>
        </div>
        <div className="pt-6 border-t border-cs-border">
          <p className="p1 text-sm text-cs-text text-center">
            © {new Date().getFullYear()} CentreExcel. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
