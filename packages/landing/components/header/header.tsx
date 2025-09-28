'use client';

import { ChevronRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Logo } from '../logo/logo';
import { ThemeSwitcher } from '../theme-switcher/theme-switcher';
import { Button } from '../ui/button';

import { MobileMenu } from './mobile-menu';

export const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = (): void => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);

        return (): void => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <header
            className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${isScrolled ? 'bg-background/80 shadow-xs' : 'bg-transparent'}`}
        >
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2 font-bold">
                    <Logo />

                    <span>Budgie</span>
                </div>

                <nav className="hidden md:flex gap-8">
                    <Link className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href="#features">
                        Features
                    </Link>

                    <Link
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        href="#testimonials"
                    >
                        Testimonials
                    </Link>

                    <Link className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href="#whitelist">
                        Whitelist
                    </Link>

                    <Link className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href="#faq">
                        FAQ
                    </Link>
                </nav>

                <div className="flex gap-4 items-center">
                    <ThemeSwitcher />

                    <Button className="hidden rounded-full md:flex">
                        Download App
                        <ChevronRight className="ml-1 size-4" />
                    </Button>

                    <Button className="md:hidden" onClick={() => void setMobileMenuOpen(prev => !prev)} size="icon" variant="ghost">
                        {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}

                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>

            {mobileMenuOpen ? <MobileMenu onClose={() => void setMobileMenuOpen(false)} /> : null}
        </header>
    );
};
