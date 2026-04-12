import { Fragment } from "react";
import { GlassCard } from "@/components/ui/glass-card";

const steps = [
  {
    step: 1,
    title: "Create an account",
    description:
      "Create your free account in seconds. No credit card required.",
  },
  {
    step: 2,
    title: "Find a challenge",
    description:
      "Browse upcoming events, filter by theme or prize, and pick one that fits.",
  },
  {
    step: 3,
    title: "Build your solution",
    description:
      "Form a team, build your solution, and submit before the deadline.",
  },
  {
    step: 4,
    title: "Win or get hired",
    description:
      "Compete for prizes and visibility, get feedback from experts.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="parent py-[100px]">
      <div className="container px-4 flex flex-col items-center gap-6">
        <div className="w-full max-w-3xl flex flex-col items-center gap-4 px-6 py-8">
          <h2 className="h2 text-center" data-aos="fade-up" data-aos-delay="0">
            How it <span>Works</span>
          </h2>
          <p
            className="p1 text-center max-w-2xl"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Get from signup to submission in four simple steps.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {steps.map((item, i) => (
            <Fragment key={item.step}>
              <GlassCard className="group p-6 hover:-translate-y-0.5 hover:border-cs-primary/35">
                <div
                  key={item.step}
                  className="flex flex-1 flex-col items-center text-center gap-3 min-w-0"
                  data-aos="fade-up"
                  data-aos-delay={String(200 + i * 100)}
                >
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-cs-primary bg-black/55 backdrop-blur-[var(--app-glass-surface-blur)] text-lg font-semibold text-cs-primary">
                    {item.step}
                  </div>
                  <h3 className="h3">{item.title}</h3>
                  <p className="p1">{item.description}</p>
                </div>
              </GlassCard>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
