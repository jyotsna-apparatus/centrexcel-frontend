
import { Button } from '../ui/button'
import Link from 'next/link'

const SiteHeader = () => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
    <h1 className="text-xl font-semibold tracking-tight text-cs-heading sm:text-2xl">
      Centrexcel
    </h1>
    <nav className="flex items-center gap-3">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/auth/login">Login</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </nav>
  </header>
  )
}

export default SiteHeader