import localFont from 'next/font/local';

import { ThemeProvider } from '../components/theme-provider';
import '../styles/globals.css';

import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';


const fixelDisplay = localFont({
    src: [
        {
            path: './fonts/fixel-display/fixel-display-regular.woff2',
            weight: '400',
            style: 'normal'
        },
        {
            path: './fonts/fixel-display/fixel-display-regular-italic.woff2',
            weight: '400',
            style: 'italic'
        },
        {
            path: './fonts/fixel-display/fixel-display-medium.woff2',
            weight: '500',
            style: 'normal'
        },
        {
            path: './fonts/fixel-display/fixel-display-medium-italic.woff2',
            weight: '500',
            style: 'italic'
        },
        {
            path: './fonts/fixel-display/fixel-display-semi-bold.woff2',
            weight: '600',
            style: 'normal'
        },
        {
            path: './fonts/fixel-display/fixel-display-semi-bold-italic.woff2',
            weight: '600',
            style: 'italic'
        },
        {
            path: './fonts/fixel-display/fixel-display-bold.woff2',
            weight: '700',
            style: 'normal'
        },
        {
            path: './fonts/fixel-display/fixel-display-bold-italic.woff2',
            weight: '700',
            style: 'italic'
        }
    ]
});

export const metadata: Metadata = {
    title: 'Budgie - Privacy-First Expense Tracker',
    description:
        'Track expenses, sync banks, manage crypto & stocks with complete privacy. Multi-currency support, debt tracking, and AI insights - all stored securely on your device.',
    keywords:
        'expense tracker, budget app, bank sync, crypto tracking, privacy, offline-first, multi-currency, debt tracking, financial management',
    authors: [{ name: 'Budgie Team' }],
    creator: 'Budgie',
    publisher: 'Budgie',
    robots: 'index, follow',
    openGraph: {
        title: 'Budgie - Privacy-First Expense Tracker',
        description:
            'Track expenses, sync banks, manage crypto & stocks with complete privacy. Multi-currency support, debt tracking, and AI insights.',
        type: 'website',
        locale: 'en_US'
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Budgie - Privacy-First Expense Tracker',
        description:
            'Track expenses, sync banks, manage crypto & stocks with complete privacy. Multi-currency support, debt tracking, and AI insights.'
    },
    generator: 'v0.app'
};

export default function RootLayout({ children }: PropsWithChildren) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={fixelDisplay.className}>
                <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
