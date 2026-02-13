import { Fragment } from "react";

const steps = [
  {
    step: 1,
    title: "Sign up",
    description: "Create your free account in seconds. No credit card required.",
  },
  {
    step: 2,
    title: "Find a hackathon",
    description: "Browse upcoming events, filter by theme or prize, and pick one that fits.",
  },
  {
    step: 3,
    title: "Build & submit",
    description: "Form a team, build your solution, and submit before the deadline.",
  },
  {
    step: 4,
    title: "Win or get hired",
    description: "Compete for prizes and visibility. Many participants land jobs from our sponsors.",
  },
];

const HowItWorks = () => {
  return (
    <section className="parent py-[100px] bg-white/5">
      <div className="container px-4 flex flex-col items-center gap-12">
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
        <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 md:gap-2 w-full max-w-5xl">
          {steps.map((item, i) => (
            <Fragment key={item.step}>
              {i > 0 && (
                <div
                  className="hidden md:block flex-1 max-w-[60px] self-center border-t border-cs-border -mx-1"
                  aria-hidden
                />
              )}
              <div
                key={item.step}
                className="flex flex-1 flex-col items-center text-center gap-3 min-w-0"
                data-aos="fade-up"
                data-aos-delay={String(200 + i * 100)}
              >
                <div className="size-12 rounded-full border-2 border-cs-primary bg-cs-card flex items-center justify-center text-cs-primary font-semibold text-lg shrink-0">
                  {item.step}
                </div>
                <h3 className="h3">{item.title}</h3>
                <p className="p1">{item.description}</p>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
