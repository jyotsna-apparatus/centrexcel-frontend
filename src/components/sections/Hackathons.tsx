"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HackathonCard } from "@/components/hackathon-card";
import { useFeaturedHackathons } from "@/hooks/use-hackathons";

const FEATURED_LIMIT = 3;

const Hackathons = () => {
  const { data: list = [], isLoading, isError } = useFeaturedHackathons(FEATURED_LIMIT);
  const hackathons = Array.isArray(list) ? list : [];

  return (
    <section id="hackathons" className="parent py-[100px]">
      <div className="container px-4 flex flex-col items-center gap-4">
        <h2 className="h2 text-center" data-aos="fade-up" data-aos-delay="0">
          Featured <span>Hackathons</span>
        </h2>
        <p
          className="p1 text-center max-w-2xl mb-8"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Upcoming events you don't want to miss. Apply now and build something
          that matters.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {isLoading &&
            [...Array(FEATURED_LIMIT)].map((_, i) => (
              <div
                key={i}
                className="card flex flex-col gap-3 animate-pulse"
                data-aos="fade-up"
                data-aos-delay={String(200 + i * 100)}
              >
                <div className="h-6 bg-cs-border rounded w-3/4" />
                <div className="h-4 bg-cs-border rounded w-1/2" />
                <div className="h-4 bg-cs-border rounded w-1/3 mt-2" />
                <div className="h-9 bg-cs-border rounded w-24 mt-auto" />
              </div>
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
              No hackathons yet. Check back soon.
            </p>
          )}
        </div>
        <div data-aos="fade-up" data-aos-delay="500">
          <Button size="lg" asChild>
            <Link href="/hackathons">View all hackathons</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Hackathons;
