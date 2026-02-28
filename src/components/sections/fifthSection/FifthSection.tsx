'use client'

import React, { useState } from 'react'

const FAQ_ITEMS = [
  {
    question: 'What is a hackathon and how does it work?',
    answer:
      'A hackathon is a time-bound event where individuals or teams build projects—often software or hardware—around a theme or challenge. You’ll typically have 24–72 hours to ideate, build, and demo. Most events include mentorship, workshops, and judging, with prizes for top projects.',
  },
  {
    question: 'Who can participate? Do I need a team?',
    answer:
      'Anyone can participate—students, professionals, and hobbyists. Many hackathons allow solo participants; others encourage or require teams (e.g. 2–4 people). Check the event rules. No prior experience is required for most events; beginners are welcome.',
  },
  {
    question: 'What should I build? Are there themes or tracks?',
    answer:
      'Most hackathons announce themes or tracks (e.g. AI, sustainability, fintech, health). You can align your project with a track for specific prizes or build something you’re passionate about. Judges look for creativity, technical execution, and impact.',
  },
  {
    question: 'What do I need to bring? Is there a registration fee?',
    answer:
      'Bring a laptop, chargers, and valid ID. Some events are free; others have a small fee. Food, swag, and venue access are usually included. Check the event page for exact requirements, code of conduct, and any software or accounts you need to set up beforehand.',
  },
  {
    question: 'How are projects judged? What are the prizes?',
    answer:
      'Projects are typically judged on innovation, technical execution, design, and impact. Judges may include industry experts and sponsors. Prizes range from cash, gadgets, and cloud credits to mentorship and incubation opportunities. Many participants value networking and learning over prizes.',
  },
]

export default function FifthSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="parent py-[100px] flex items-center">
      <div className="container flex flex-col lg:flex-row gap-12 lg:gap-16 items-start">
        {/* Left column: header */}
        <div className="w-full lg:max-w-[40%] flex flex-col gap-6">
          <span className="chip w-fit uppercase">FAQ</span>
          <h2 className="h2 font-semibold text-cs-heading leading-tight">
            Frequently
            <br />
            asked
            <br />
            questions
          </h2>
          <p className="p1 text-(--cs-text)/90 max-w-sm">
            Got any questions? Let us know! Reach out and our team will get right back to you.
          </p>
          <a
            href="#contact"
            className="btn-2 w-fit border-white/20 text-white hover:border-white/40"
            aria-label="Contact us"
          >
            Contact us
          </a>
        </div>

        {/* Right column: accordion */}
        <div className="w-full lg:max-w-[60%] flex flex-col gap-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="rounded-xl border border-cs-border bg-cs-card overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-white/3 transition-colors"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  id={`faq-question-${index}`}
                >
                  <span className="font-semibold text-cs-heading text-base pr-4">
                    {item.question}
                  </span>
                  <span
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-cs-border text-cs-heading text-lg leading-none"
                    aria-hidden
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                <div
                  id={`faq-answer-${index}`}
                  role="region"
                  aria-labelledby={`faq-question-${index}`}
                  className="grid transition-[grid-template-rows] duration-200 ease-out"
                  style={{
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="p1 text-(--cs-text)/85 text-sm px-5 pb-4 pt-0">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
