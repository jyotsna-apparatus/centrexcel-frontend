'use client'

import React from 'react'
import Image from 'next/image'

const TESTIMONIALS = [
  {
    quote: "The mentorship and community here pushed our project from a weekend idea to something we're actually launching. Best hackathon experience we've had.",
    name: 'Alex Chen',
    role: 'Built a fintech prototype',
    logo: '/logo/1.svg',
    logoAlt: 'Company 1',
  },
  {
    quote: 'Finally a hackathon where judges give real feedback instead of scores and leave. We iterated twice during the event and it showed in the demo.',
    name: 'Jordan Rivera',
    role: 'Won best use of AI',
    logo: '/logo/2.svg',
    logoAlt: 'Company 2',
  },
  {
    quote: 'Met my co-founder here. The network and the problems we worked on were the right mix of ambitious and grounded. Highly recommend.',
    name: 'Sam Williams',
    role: 'Started a startup post-hackathon',
    logo: '/logo/3.svg',
    logoAlt: 'Company 3',
  },
  {
    quote: 'The quality of feedback and the caliber of mentors made all the difference. We pivoted our idea on day one and ended up in the top three.',
    name: 'Morgan Lee',
    role: 'Built a devtools product',
    logo: '/logo/4.svg',
    logoAlt: 'Company 4',
  },
]

const LOGO_FILTER = 'saturate(0) brightness(0) invert(1)'

export default function FourthSection() {
  return (
    <section className="parent py-[100px] relative ">

<div className="absolute inset-0 w-full h-full">
  <Image src="/fourth.png" alt="Fourth Section" fill  className="object-contain" />
</div>



      <div className="container flex flex-col items-center z-10 relative  ">
        <span className="chip mb-4">Success stories</span>
        <h2 className="h2 text-center max-w-2xl mb-4">
          Hear from builders & their success stories
        </h2>
        <p className="p1 text-center max-w-xl mb-14 text-(--cs-text)/90">
          See how past participants turned ideas into demos—and sometimes into real products and teams.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full gap-6 max-w-6xl">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="glass flex flex-col h-full p-4 rounded-3xl">
              <div className="mb-4">
                <Image
                  src={t.logo}
                  alt={t.logoAlt}
                  width={80}
                  height={32}
                  className="object-contain h-8 w-auto"
                  style={{ filter: LOGO_FILTER }}
                />
              </div>
              <blockquote className="p1 text-(--cs-text)/90 italic mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3 mt-auto">
                <img
                  src={`https://thispersondoesnotexist.com/?v=${i + 1}`}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-full w-12 h-12 object-cover shrink-0"
                />
                <footer>
                  <div className="font-semibold text-cs-heading">{t.name}</div>
                  <div className="text-sm text-(--cs-text)/70">{t.role}</div>
                </footer>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
