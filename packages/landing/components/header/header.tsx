'use client';

import { ChevronRight, Menu, Moon, Sun, X } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import { Logo } from '../logo/logo';
import { Button } from '../ui/button';

import { MobileMenu } from './mobile-menu';

export const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const handleScroll = (): void => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);

        return (): void => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const toggleTheme = (): void => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    return (
        <header
            className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${isScrolled ? 'bg-background/80 shadow-sm' : 'bg-transparent'}`}
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

                <div className="hidden md:flex gap-4 items-center">
                    <Button className="rounded-full" onClick={toggleTheme} size="icon" variant="ghost">
                        {mounted && theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}

                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    <Button className="rounded-full">
                        Download App
                        <ChevronRight className="ml-1 size-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-4 md:hidden">
                    <Button className="rounded-full" onClick={toggleTheme} size="icon" variant="ghost">
                        {mounted && theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                    </Button>

                    <Button onClick={() => void setMobileMenuOpen(!mobileMenuOpen)} size="icon" variant="ghost">
                        {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}

                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </div>
            </div>

            {mobileMenuOpen ? <MobileMenu onClose={() => void setMobileMenuOpen(false)} /> : null}
        </header>
    );
};
