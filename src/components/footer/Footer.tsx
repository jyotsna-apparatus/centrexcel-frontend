import Link from 'next/link'

const Footer = () => {
    return (
        <footer className="mt-24 border-t border-cs-border pt-8 text-center text-sm text-cs-text">
            <Link href="/auth/login" className="link-highlight">
                Login
            </Link>
            {' · '}
            <Link href="/auth/sign-up" className="link-highlight">
                Sign up
            </Link>
        </footer>
    )
}

export default Footer