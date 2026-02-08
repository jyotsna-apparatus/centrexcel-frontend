'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-cs-black">
      <div className="pattern" aria-hidden />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-12">
    

        <section className="mt-16 text-center">
          <h2 className="h2 text-cs-heading">Build. Compete. Win.</h2>
          <p className="p1 mx-auto mt-4 max-w-2xl text-cs-text">
            Join live challenges, form teams, and submit your best solutions. From hackathons to
            startup challenges—one platform for it all.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild>
              <Link href="/auth/sign-up">Create account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </section>

        
      </div>
    </div>
  )
}
