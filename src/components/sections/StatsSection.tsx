"use client";

import CountUp from "react-countup";
import { GlassCard } from "@/components/ui/glass-card";

function CountUpSection({
  end,
  description,
  symbol,
  before,
}: {
  end: number;
  description: string;
  symbol: string;
  before?: string;
}) {
  return (
    <div className="flex">
      <div className="flex flex-col items-center justify-center gap-1">
        <h2 className="h1 ">
          <span>{before}</span>
          <CountUp duration={10} delay={1} end={end} />
          <span>{symbol}</span>
        </h2>
        <p className="p1">{description}</p>
      </div>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="parent py-12">
      <div className="container px-4 flex flex-wrap items-center justify-center gap-6 md:gap-10">
        <GlassCard className="flex w-full justify-center px-8 py-6 sm:w-auto sm:min-w-[200px] sm:max-w-[280px] sm:flex-1">
          <CountUpSection
            end={100}
            description="Active Challenges"
            symbol="+"
          />
        </GlassCard>
        <GlassCard className="flex w-full justify-center px-8 py-6 sm:w-auto sm:min-w-[200px] sm:max-w-[280px] sm:flex-1">
          <CountUpSection end={1000} description="Participants" symbol="+" />
        </GlassCard>
        <GlassCard className="flex w-full justify-center px-8 py-6 sm:w-auto sm:min-w-[200px] sm:max-w-[280px] sm:flex-1">
          <CountUpSection
            end={100}
            description="Prize upto"
            symbol="K"
            before="₹"
          />
        </GlassCard>
      </div>
    </section>
  );
}
