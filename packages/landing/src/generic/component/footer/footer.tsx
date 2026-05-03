/* eslint-disable react/jsx-max-depth */

import { Trans } from '@lingui/react/macro';
import { Github } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { Logo } from '../logo/logo';

interface Props {
    lang: string;
}

// eslint-disable-next-line max-lines-per-function
export const Footer = ({ lang }: Props) => {
    const date = useMemo(() => new Date().getFullYear(), []);

    return (
        <footer className="w-full border-t bg-background/95 backdrop-blur-xs">
            <div className="container flex flex-col gap-8 px-4 py-10 md:px-6 lg:py-16">
                <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5">
                    <div className="space-y-4">
                        <Link className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity" href={`/${lang}`}>
                            <Logo />

                            <span>
                                <Trans>Budgie</Trans>
                            </span>
                        </Link>

                        <p className="text-sm text-muted-foreground">
                            <Trans>
                                The privacy-first expense tracker that keeps your financial data exactly where it belongs—on your device.
                            </Trans>
                        </p>

                        <div className="flex gap-4">
                            <Link
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                href="https://github.com/budgie-at/budgie"
                            >
                                <Github className="size-5" />

                                <span className="sr-only">
                                    <Trans>GitHub</Trans>
                                </span>
                            </Link>

                            <Link className="text-muted-foreground hover:text-foreground transition-colors" href="https://x.com/budgie_at">
                                <svg
                                    className="size-5"
                                    fill="none"
                                    height="24"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    width="24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                                </svg>

                                <span className="sr-only">
                                    <Trans>Twitter</Trans>
                                </span>
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold">
                            <Trans>App</Trans>
                        </h4>

                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/${lang}#features`}>
                                    <Trans>Features</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/${lang}#faq`}>
                                    <Trans>FAQ</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/${lang}#waitlist`}>
                                    <Trans>Join Waitlist</Trans>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold">
                            <Trans>Features</Trans>
                        </h4>

                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/features/offline-first-expense-tracker`}
                                >
                                    <Trans>Offline-First</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/features/monobank-sync`}
                                >
                                    <Trans>Bank Sync</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/features/ai-auto-categorization`}
                                >
                                    <Trans>AI Categorization</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/features/voice-transaction-entry`}
                                >
                                    <Trans>Voice Entry</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/features/net-worth-tracker`}
                                >
                                    <Trans>Net Worth</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/${lang}/features`}>
                                    <Trans>All Features</Trans>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold">
                            <Trans>Resources</Trans>
                        </h4>

                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href={`/${lang}/blog`}>
                                    <Trans>Blog</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href="https://github.com/budgie-at/budgie"
                                >
                                    <Trans>Source Code</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/blog/ynab-alternatives-privacy`}
                                >
                                    <Trans>YNAB Alternatives</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/blog/mint-alternatives-developers`}
                                >
                                    <Trans>Mint Alternatives</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/blog/cloud-budgeting-privacy-risks`}
                                >
                                    <Trans>Privacy Guide</Trans>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold">
                            <Trans>Legal</Trans>
                        </h4>

                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/legal/privacy-policy`}
                                >
                                    <Trans>Privacy Policy</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/legal/terms-of-service`}
                                >
                                    <Trans>Terms of Service</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    href={`/${lang}/legal/license`}
                                >
                                    <Trans>License</Trans>
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row justify-between items-center border-t border-border/40 pt-8">
                    <p className="text-xs text-muted-foreground">
                        <Trans>&copy; {date} Budgie. All rights reserved.</Trans>
                    </p>

                    <div className="flex gap-4">
                        <Link
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            href={`/${lang}/legal/privacy-policy`}
                        >
                            <Trans>Privacy Policy</Trans>
                        </Link>

                        <Link
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            href={`/${lang}/legal/terms-of-service`}
                        >
                            <Trans>Terms of Service</Trans>
                        </Link>

                        <Link
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            href={`/${lang}/legal/license`}
                        >
                            <Trans>Open Source License</Trans>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
