'use client'

import CountUp from 'react-countup';

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
    <section className="parent py-12 bg-white/3">
      <div className="container px-4">
        <div className="flex items-center justify-center gap-50 flex-wrap">
          <CountUpSection end={100} description="Active Hackathons" symbol="+" />
          <CountUpSection end={1000} description="Participants" symbol="+" />
          <CountUpSection end={100} description="Prize upto" symbol="K" before="₹" />
        </div>
      </div>
    </section>
  );
}
