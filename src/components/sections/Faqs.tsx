"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What is CentreExcel?",
    answer:
      "CentreExcel is a platform where you can discover hackathons, solve real challenges from top companies, and connect with opportunities. We bring together participants, sponsors, and judges in one place.",
  },
  {
    question: "How do I join a hackathon?",
    answer:
      "Sign up for a free account, browse upcoming hackathons, and click Apply on any event you’re interested in. You can form a team or join as an individual. Follow the event rules and submit before the deadline.",
  },
  {
    question: "Are there prizes?",
    answer:
      "Yes. Most hackathons on CentreExcel offer cash prizes, swag, and recognition. Prize amounts and criteria are listed on each event page.",
  },
  {
    question: "Who can participate?",
    answer:
      "Anyone can participate—students, professionals, and hobbyists. Some events may have eligibility rules (e.g. region or theme); check the event details before applying.",
  },
  {
    question: "How do I submit my project?",
    answer:
      "After building your solution, go to the hackathon page and use the Submit button before the deadline. You’ll typically provide a link to your repo, a short description, and sometimes a demo video.",
  },
];

const Faqs = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faqs" className="parent py-[100px] bg-white/3">
      <div className="container px-4 flex flex-col items-center gap-4">
        <h2 className="h2 text-center" data-aos="fade-up" data-aos-delay="0">
          Frequently <span>Asked</span> Questions
        </h2>
        <p
          className="p1 text-center max-w-2xl mb-8"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Quick answers to common questions. Can’t find what you need? Reach out
          to our support team.
        </p>
        <div
          className="w-full max-w-2xl  rounded-lg overflow-hidden grid grid-cols-1 gap-4 p-4"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={item.question}
                className=" cs-card glass w-full rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-white/3 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-cs-heading">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-cs-primary transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="p1 pl-0">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Faqs;
