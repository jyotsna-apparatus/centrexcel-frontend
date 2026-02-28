'use client'

import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import {  Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const LOGOS = [
  { src: '/logo/1.svg', alt: 'Logo 1' },
  { src: '/logo/2.svg', alt: 'Logo 2' },
  { src: '/logo/3.svg', alt: 'Logo 3' },
  { src: '/logo/4.svg', alt: 'Logo 4' },
  { src: '/logo/5.svg', alt: 'Logo 5' },
  { src: '/logo/1.svg', alt: 'Logo 1' },
  { src: '/logo/2.svg', alt: 'Logo 2' },
  { src: '/logo/3.svg', alt: 'Logo 3' },
  { src: '/logo/4.svg', alt: 'Logo 4' },
  { src: '/logo/5.svg', alt: 'Logo 5' },
  { src: '/logo/1.svg', alt: 'Logo 1' },
  { src: '/logo/2.svg', alt: 'Logo 2' },
  { src: '/logo/3.svg', alt: 'Logo 3' },
  { src: '/logo/4.svg', alt: 'Logo 4' },
  { src: '/logo/5.svg', alt: 'Logo 5' },
  { src: '/logo/1.svg', alt: 'Logo 1' },
  { src: '/logo/2.svg', alt: 'Logo 2' },
  { src: '/logo/3.svg', alt: 'Logo 3' },
  { src: '/logo/4.svg', alt: 'Logo 4' },
  { src: '/logo/5.svg', alt: 'Logo 5' },
]

const LOGO_FILTER = 'saturate(0) brightness(0) invert(1)'

export default function SecondSection() {
  return (
    <section className='parent py-[40px]'>
      <div className='container flex flex-col items-center justify-center'>

        <p className="p1 mb-12">
          Trusted by 150,000+ users worldwide
        </p>

        <div className="w-full">
          <Swiper
            slidesPerView={5}
            spaceBetween={10}
        
            autoplay={{
              delay: 1000,
              disableOnInteraction: false,
            }}
            modules={ [Autoplay]}
            className="mySwiper pb-12"
          >
            {LOGOS.map((logo, i) => (
              <SwiperSlide key={i} className="flex items-center justify-center">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={48}
                  height={28}
                  className="object-contain h-6 w-auto"
                  style={{ filter: LOGO_FILTER }}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

      </div>
    </section>
  )
}
