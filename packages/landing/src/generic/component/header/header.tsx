'use client';

import { Trans } from '@lingui/react/macro';
import { ChevronRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '../../../ui/button';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { Logo } from '../logo/logo';
import { ThemeSwitcher } from '../theme-switcher/theme-switcher';

import { MobileMenu } from './mobile-menu';

interface HeaderProps {
    locale?: string;
}

export const Header = ({ locale }: HeaderProps = {}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();

    // Extract locale from pathname if not provided
    const currentLocale = locale || (pathname ? pathname.split('/')[1] : 'en') || 'en';
    const homeUrl = `/${currentLocale}`;
    const blogUrl = `/${currentLocale}/blog`;

    useEffect(() => {
        const handleScroll = (): void => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);

        return (): void => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleMenuToggle = () => void setMobileMenuOpen(prev => !prev);
    const handleMobileMenuClose = () => void setMobileMenuOpen(false);

    return (
        <header
            className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${isScrolled ? 'bg-background/80 shadow-xs' : 'bg-transparent'}`}
        >
            <div className="container flex h-16 items-center justify-between">
                <Link className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity" href={homeUrl}>
                    <Logo />

                    <span>
                        <Trans>Budgie</Trans>
                    </span>
                </Link>

                <nav className="hidden md:flex gap-8">
                    <Link
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        href={`${homeUrl}#features`}
                    >
                        <Trans>Features</Trans>
                    </Link>

                    <Link
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        href={`${homeUrl}#testimonials`}
                    >
                        <Trans>Testimonials</Trans>
                    </Link>

                    <Link className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground" href={blogUrl}>
                        <Trans>Blog</Trans>
                    </Link>

                    <Link
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        href={`${homeUrl}#whitelist`}
                    >
                        <Trans>Whitelist</Trans>
                    </Link>

                    <Link
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        href={`${homeUrl}#faq`}
                    >
                        <Trans>FAQ</Trans>
                    </Link>
                </nav>

                <div className="flex gap-4 items-center">
                    <LanguageSwitcher />
                    <ThemeSwitcher />

                    <Button className="hidden rounded-full md:flex">
                        <Trans>Download App</Trans>
                        <ChevronRight className="ml-1 size-4" />
                    </Button>

                    <Button className="md:hidden" onClick={handleMenuToggle} size="icon" variant="ghost">
                        {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}

                        <span className="sr-only">
                            <Trans>Toggle menu</Trans>
                        </span>
                    </Button>
                </div>
            </div>

            {mobileMenuOpen ? <MobileMenu locale={currentLocale} onClose={handleMobileMenuClose} /> : null}
        </header>
    );
};
