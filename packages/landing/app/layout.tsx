import type { PropsWithChildren } from 'react';

import '@/styles/globals.css';
import { Inter } from 'next/font/google';

import type { Metadata } from 'next';

import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

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
        <html
            lang="en"
            suppressHydrationWarning
        >
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    disableTransitionOnChange
                    enableSystem
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
