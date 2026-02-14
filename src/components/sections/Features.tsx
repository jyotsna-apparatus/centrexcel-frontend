import {
  Trophy,
  Target,
  Zap,
  Rocket,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Discover Hackathons",
    description:
      "Browse world-class hackathons from top companies. Filter by theme, deadline, and prize pool to find the right fit.",
  },
  {
    icon: Zap,
    title: "Solve Real Challenges",
    description:
      "Tackle problems that matter. Build solutions for real industry challenges and get feedback from experts.",
  },
  {
    icon: Trophy,
    title: "Win Prizes",
    description:
      "Compete for cash prizes, swag, and recognition. Top performers get visibility with sponsors and recruiters.",
  },
  {
    icon: Rocket,
    title: "Launch Your Career",
    description:
      "Showcase your work, connect with recruiters, and land opportunities. Many participants get hired from our events.",
  },
];

const Features = () => {
  return (
    <section id="features" className="parent py-[100px]">
      <div className="container px-4 flex flex-col items-center gap-4">
        <h2 className="h2 text-center" data-aos="fade-up" data-aos-delay="0">
          Why <span>CentreExcel</span>
        </h2>
        <p
          className="p1 text-center max-w-2xl mb-8"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          One platform to discover hackathons, solve real challenges, and take
          the next step in your career.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="card cs-card flex flex-col gap-4 glass"
                data-aos="fade-up"
                data-aos-delay={String(200 + i * 100)}
              >
                <div className="text-cs-primary bg-cs-primary rounded-lg p-2 w-fit">
                  <Icon className="size-8" color="black" />
                </div>
                <h3 className="h3">{feature.title}</h3>
                <p className="p1 opacity-50">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
