import '../../../styles/globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const metadata: Metadata = {
    robots: { index: false, follow: false }
};

export default function EnableBankingLayout({ children }: Props) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
