"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { HackathonCard } from "@/components/hackathon-card";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { getFeaturedChallenges } from "@/lib/challenges-api";

const FEATURED_LIMIT = 3;

const Challenges = () => {
  const { data: list = [], isLoading, isError } = useQuery({
    queryKey: ["featured-challenges", FEATURED_LIMIT],
    queryFn: () => getFeaturedChallenges(FEATURED_LIMIT),
  });
  const hackathons = Array.isArray(list) ? list : [];

  return (
    <section id="hackathons" className="parent py-[100px] bg-black/60">
      <div className="container px-4 flex flex-col items-center gap-6">
        <div className="w-full max-w-3xl flex flex-col items-center gap-4 px-6 py-8">
          <h2 className="h2 text-center" data-aos="fade-up" data-aos-delay="0">
            Featured <span>Challenges</span>
          </h2>
          <p
            className="p1 text-center max-w-2xl"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Upcoming events you don't want to miss. Apply now and build
            something that matters.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {isLoading &&
            [...Array(FEATURED_LIMIT)].map((_, i) => (
              <GlassCard
                key={i}
                className="flex flex-col gap-3 animate-pulse p-4"
                data-aos="fade-up"
                data-aos-delay={String(200 + i * 100)}
              >
                <div className="h-6 bg-cs-border rounded w-3/4" />
                <div className="h-4 bg-cs-border rounded w-1/2" />
                <div className="h-4 bg-cs-border rounded w-1/3 mt-2" />
                <div className="h-9 bg-cs-border rounded w-24 mt-auto" />
              </GlassCard>
            ))}
          {!isLoading &&
            hackathons.map((hackathon, i) => (
              <HackathonCard
                key={hackathon.id}
                hackathon={hackathon}
                variant="featured"
                dataAos="fade-up"
                dataAosDelay={String(200 + i * 100)}
              />
            ))}
          {!isLoading && hackathons.length === 0 && !isError && (
            <p
              className="p1 text-cs-text col-span-full text-center"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              No challenges yet. Check back soon.
            </p>
          )}
          {!isLoading && isError && (
            <p
              className="p1 text-cs-text col-span-full text-center"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              Could not load featured challenges. Please check API connection.
            </p>
          )}
        </div>
        <div data-aos="fade-up" data-aos-delay="500">
          <Button size="lg" asChild>
            <Link href="/challenges">View all challenges</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Challenges;
