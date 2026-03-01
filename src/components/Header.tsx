'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  Terminal,
  GithubLogo,
  SignOut,
  List,
  X,
  Sparkle
} from 'phosphor-react';

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: '/', label: 'Directory' },
    { href: '/submit', label: 'Submit' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-primary/30 blur-xl group-hover:blur-2xl transition-all" />
              <Terminal
                size={28}
                weight="duotone"
                className="relative text-accent-primary"
              />
            </div>
            <span className="text-lg font-bold font-heading tracking-tight">
              Claw<span className="text-accent-primary">Dealership</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'text-accent-primary bg-accent-primary/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="h-8 w-8 rounded-full border-2 border-border"
                  />
                )}
                <button
                  onClick={() => signOut()}
                  className="hidden sm:flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  <SignOut size={18} />
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('github')}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                <GithubLogo size={18} weight="fill" />
                Sign in
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-text-secondary hover:text-text-primary"
            >
              {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border-subtle animate-slide-down">
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    pathname === link.href
                      ? 'text-accent-primary bg-accent-primary/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!session && (
                <button
                  onClick={() => signIn('github')}
                  className="btn-primary mt-2 text-center justify-center flex"
                >
                  <GithubLogo size={18} weight="fill" className="mr-2" />
                  Sign in with GitHub
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

import React from 'react';
