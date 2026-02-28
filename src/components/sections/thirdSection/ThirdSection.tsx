import React from 'react'
import Image from 'next/image'

export default function ThirdSection() {
  const cards = [
    {
      title: 'Expert mentorship',
      description: 'Work with industry leaders and seasoned builders who guide you from idea to demo. Get real feedback, not just judging—so you ship something you’re proud of.',
      image: '/third/landscape2.webp',

    },
    {
      title: 'Real-world impact',
      description: 'Tackle problems that matter. Our challenges are tied to actual use cases and partners, so your project can turn into something people actually use.',
      image: '/third/square2.webp',
    },
    {
      title: 'Community & network',
      description: 'Join a global community of builders. Find co-founders, collaborators, and friends—and leave with a network that lasts long after the hackathon.',
      image: '/third/square1.webp',
    },
    {
      title: 'Prizes & recognition',
      description: 'Compete for meaningful prizes and get your project in front of partners and investors. Win visibility, feedback, and support to take the next step.',
      image: '/third/landscape4.webp',
    },
  ]

  return (
    <section className="parent py-[100px] ">
      <div className="container flex flex-col items-center">
        <span className="chip mb-4">Why choose us</span>
        <h2 className="h2 text-center max-w-2xl mb-4">
          Build with people who get it
        </h2>
        <p className="p1 text-center max-w-xl mb-14 text-(--cs-text)/90">
          We’re not just another hackathon. We focus on what actually helps you ship: mentorship, real problems, and a community that sticks around.
        </p>

        <div className=" grid grid-cols-10  w-full gap-8">

          <div className="col-span-6 card-wrapper">
            <div className="spinner"></div>
            <div className="card-container flex flex-col gap-4 h-full w-full ">
              <div className='relative  w-full h-[300px] rounded-md overflow-hidden'>
                <Image src={cards[0].image} alt="" fill className="object-cover" />
              </div>
              <h3 className="h3 mb-2">{cards[0].title}</h3>
              <p className="p1 text-(--cs-text)/80">{cards[0].description}</p>
            </div>

          </div>

          <div className="col-span-4 card-wrapper">
            <div className="spinner"></div>
            <div className="card-container flex flex-col gap-4 h-full w-full ">
              <div className='relative  w-full h-[300px] rounded-md overflow-hidden'>
                <Image src={cards[1].image} alt="" fill className="object-cover" />
              </div>
              <h3 className="h3 mb-2">{cards[1].title}</h3>
              <p className="p1 text-(--cs-text)/80">{cards[1].description}</p>
            </div>

          </div>

          <div className="col-span-4 card-wrapper">
            <div className="spinner"></div>
            <div className="card-container flex flex-col gap-4 h-full w-full ">
              <div className='relative  w-full h-[300px] rounded-md overflow-hidden'>
                <Image src={cards[2].image} alt="" fill className="object-cover" />
              </div>
              <h3 className="h3 mb-2">{cards[2].title}</h3>
              <p className="p1 text-(--cs-text)/80">{cards[2].description}</p>
            </div>

          </div>

          <div className="col-span-6 card-wrapper">
            <div className="spinner"></div>
            <div className="card-container flex flex-col gap-4 h-full w-full ">
              <div className='relative  w-full h-[300px] rounded-md overflow-hidden'>
                <Image src={cards[3].image} alt="" fill className="object-cover" />
              </div>
              <h3 className="h3 mb-2">{cards[3].title}</h3>
              <p className="p1 text-(--cs-text)/80">{cards[3].description}</p>
            </div>

          </div>

         

        </div>

       
      </div>
    </section>
  )
}
