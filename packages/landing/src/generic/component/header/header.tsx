'use client';

import { Trans } from '@lingui/react/macro';
import { ChevronRight, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '../../../ui/button';
import { useSmoothScroll } from '../../hook/use-smooth-scroll.hook';
import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { Logo } from '../logo/logo';
import { MobileMenu } from '../mobile-menu/mobile-menu';
import { ThemeSwitcher } from '../theme-switcher/theme-switcher';

interface Props {
    lang: string;
}

export const Header = ({ lang }: Props) => {
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

    const handleMenuToggle = () => void setMobileMenuOpen(prev => !prev);
    const handleMobileMenuClose = () => void setMobileMenuOpen(false);

    const { handleScrollToFeatures, handleScrollToTestimonials, handleScrollToWaitlist, handleScrollToFaq } = useSmoothScroll();

    return (
        <header
            className={`sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${isScrolled ? 'bg-background/80 shadow-xs' : 'bg-transparent'}`}
        >
            <div className="container flex h-16 items-center justify-between">
                <Link className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity" href={`/${lang}`}>
                    <Logo />

                    <span>
                        <Trans>Budgie</Trans>
                    </span>
                </Link>

                <nav className="hidden md:flex gap-8">
                    <Link
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        href={`/${lang}#features`}
                        onClick={handleScrollToFeatures}
                    >
                        <Trans>Features</Trans>
                    </Link>

                    <Link
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        href={`/${lang}#testimonials`}
                        onClick={handleScrollToTestimonials}
                    >
                        <Trans>Testimonials</Trans>
                    </Link>

                    <Link
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        href={`/${lang}/blog`}
                    >
                        <Trans>Blog</Trans>
                    </Link>

                    <Link
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        href={`/${lang}#faq`}
                        onClick={handleScrollToFaq}
                    >
                        <Trans>FAQ</Trans>
                    </Link>
                </nav>

                <div className="flex gap-4 items-center">
                    <LanguageSwitcher />
                    <ThemeSwitcher />

                    <Button asChild className="hidden rounded-full md:flex">
                        <Link href={`/${lang}#waitlist`} onClick={handleScrollToWaitlist}>
                            <Trans>Join Waitlist</Trans>
                            <ChevronRight className="ml-1 size-4" />
                        </Link>
                    </Button>

                    <Button className="md:hidden" onClick={handleMenuToggle} size="icon" variant="ghost">
                        {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}

                        <span className="sr-only">
                            <Trans>Toggle menu</Trans>
                        </span>
                    </Button>
                </div>
            </div>

            {mobileMenuOpen ? <MobileMenu lang={lang} onClose={handleMobileMenuClose} /> : null}
        </header>
    );
};
