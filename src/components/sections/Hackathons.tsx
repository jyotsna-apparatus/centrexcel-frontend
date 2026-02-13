import Link from "next/link";
import { Button } from "@/components/ui/button";

const hackathons = [
  {
    title: "Build for Good Hackathon",
    date: "Mar 15 – 17, 2025",
    prize: "₹2,00,000",
    href: "/hackathons",
  },
  {
    title: "Fintech Innovation Challenge",
    date: "Apr 1 – 3, 2025",
    prize: "₹1,50,000",
    href: "/hackathons",
  },
  {
    title: "Climate Tech Sprint",
    date: "Apr 20 – 22, 2025",
    prize: "₹1,00,000",
    href: "/hackathons",
  },
];

const Hackathons = () => {
  return (
    <section className="parent py-[100px]">
      <div className="container px-4 flex flex-col items-center gap-12">
        <h2 className="h2 text-center" data-aos="fade-up" data-aos-delay="0">
          Featured <span>Hackathons</span>
        </h2>
        <p
          className="p1 text-center max-w-2xl"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Upcoming events you don’t want to miss. Apply now and build something
          that matters.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          {hackathons.map((hackathon, i) => (
            <div
              key={hackathon.title}
              className="card flex flex-col gap-3"
              data-aos="fade-up"
              data-aos-delay={String(200 + i * 100)}
            >
              <h3 className="h3">{hackathon.title}</h3>
              <p className="p1 text-cs-text">{hackathon.date}</p>
              <p className="p1">
                Prize: <span className="text-cs-primary">{hackathon.prize}</span>
              </p>
              <Button variant="outline" size="sm" asChild className="mt-auto w-fit">
                <Link href={hackathon.href}>View details</Link>
              </Button>
            </div>
          ))}
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
