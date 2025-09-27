'use client';

import Link from 'next/link';

import { FooterDetails } from './footer-details';
import { FooterLinksGroup } from './footer-links-group';

import type { FooterLinksGroupProps } from './footer-links-group';

const footerLinkGroups: FooterLinksGroupProps[] = [
    {
        title: 'App',
        links: [
            {
                title: 'Features',
                href: '#features'
            },
            {
                title: 'Whitelist',
                href: '#whitelist'
            },
            {
                title: 'Download',
                href: '#download'
            },
            {
                title: 'Roadmap',
                href: '#roadmap'
            }
        ]
    },
    {
        title: 'Resources',
        links: [
            {
                title: 'Documentation',
                href: '#documentation'
            },
            {
                title: 'Privacy Guide',
                href: '#privacy-guide'
            },
            {
                title: 'Source Code',
                href: '#source-code'
            },
            {
                title: 'Support',
                href: '#support'
            }
        ]
    },
    {
        title: 'Legal',
        links: [
            {
                title: 'Privacy Policy',
                href: '#privacy-policy'
            },
            {
                title: 'Terms of Service',
                href: '#terms-of-service'
            },
            {
                title: 'License',
                href: '#license'
            },
            {
                title: 'Security',
                href: '#security'
            }
        ]
    }
];

export const Footer = () => (
    <footer className="w-full border-t bg-background/95 backdrop-blur-sm">
        <div className="container flex flex-col gap-8 px-4 py-10 md:px-6 lg:py-16">
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
                <FooterDetails />

                {footerLinkGroups.map(({ title, links }) => (
                    <FooterLinksGroup key={title} links={links} title={title} />
                ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row justify-between items-center border-t border-border/40 pt-8">
                <p className="text-xs text-muted-foreground">
                    &copy;
                    {new Date().getFullYear()} Budgie. All rights reserved.
                </p>

                <div className="flex gap-4">
                    <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">
                        Privacy Policy
                    </Link>

                    <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">
                        Terms of Service
                    </Link>

                    <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="#">
                        Open Source License
                    </Link>
                </div>
            </div>
        </div>
    </footer>
);
