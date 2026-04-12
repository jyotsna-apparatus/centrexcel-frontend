import Image from "next/image";
import { GlassCard } from "@/components/ui/glass-card";

const FEATURED_HACKATHONS = [
  {
    number: "1",
    title: "AI Frontier Challenge",
    description:
      "Build the next generation of AI-powered products. From agents to automation—48 hours to ship something that matters.",
    image: "/third/1.avif",
    gradient:
      "linear-gradient(135deg, rgba(0, 106, 255, 0.25) 0%, transparent 50%, rgba(255, 89, 0, 0.2) 100%)",
  },
  {
    number: "2",
    title: "Sustainable Tech Challenge",
    description:
      "Tackle climate and impact with tech. Partner with NGOs and judges who care about real-world outcomes.",
    image: "/third/2.avif",
    gradient:
      "linear-gradient(135deg, rgba(0, 106, 255, 0.2) 0%, transparent 70%)",
  },
  {
    number: "3",
    title: "Build in Public Showcase",
    description:
      "Ship live in 72 hours and get feedback from the community. Best demos win prizes and visibility.",
    image: "/third/3.avif",
    gradient:
      "linear-gradient(135deg, transparent 30%, rgba(255, 89, 0, 0.25) 100%)",
  },
];

export default function SixthSection() {
  return (
    <section className="parent py-[100px]">
      <div className="container flex flex-col items-center">
        <div className="flex w-full max-w-3xl flex-col items-center px-6 py-8 mb-10">
          <span className="chip mb-4">Featured</span>
          <h2 className="h2 text-center max-w-2xl mb-4">
            Three hackathons you don’t want to miss
          </h2>
          <p className="p1 text-center max-w-xl text-(--cs-text)/90">
            From AI to impact to building in public—pick your track and ship
            something in a weekend.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-6 w-full">
          {FEATURED_HACKATHONS.map((hack) => (
            <div key={hack.number} className="card-wrapper group">
              <div className="spinner" />
              <GlassCard className="relative z-[1] flex h-full w-full flex-col gap-4 rounded-lg p-4">
                <div className="relative w-full h-[180px] rounded-md overflow-hidden">
                  <div
                    className="absolute inset-0 z-0"
                    style={{ background: hack.gradient }}
                  />
                  <Image
                    src={hack.image}
                    alt=""
                    fill
                    className="object-cover mix-blend-overlay opacity-80 group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-lg font-semibold text-cs-heading backdrop-blur-[var(--app-glass-surface-blur)]">
                    {hack.number}
                  </div>
                </div>
                <h3 className="h3 mb-1">{hack.title}</h3>
                <p className="p1 text-(--cs-text)/80">{hack.description}</p>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
