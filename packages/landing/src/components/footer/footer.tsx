'use client';
/* eslint-disable react/jsx-max-depth */

import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import { FooterDetails } from './footer-details';

// eslint-disable-next-line max-lines-per-function
export const Footer = () => {
    const date = new Date().getFullYear();

    return (
        <footer className="w-full border-t bg-background/95 backdrop-blur-xs">
            <div className="container flex flex-col gap-8 px-4 py-10 md:px-6 lg:py-16">
                <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                    <FooterDetails />

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold">
                            <Trans>App</Trans>
                        </h4>

                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#features">
                                    <Trans>Features</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#whitelist">
                                    <Trans>Whitelist</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#download">
                                    <Trans>Download</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#roadmap">
                                    <Trans>Roadmap</Trans>
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
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#documentation">
                                    <Trans>Documentation</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#privacy-guide">
                                    <Trans>Privacy Guide</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#source-code">
                                    <Trans>Source Code</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#support">
                                    <Trans>Support</Trans>
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
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#privacy-policy">
                                    <Trans>Privacy Policy</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#terms-of-service">
                                    <Trans>Terms of Service</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#license">
                                    <Trans>License</Trans>
                                </Link>
                            </li>
                            <li>
                                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#security">
                                    <Trans>Security</Trans>
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
                        <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">
                            <Trans>Privacy Policy</Trans>
                        </Link>

                        <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">
                            <Trans>Terms of Service</Trans>
                        </Link>

                        <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">
                            <Trans>Open Source License</Trans>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
