import { Trans } from '@lingui/react/macro';
import { Github } from 'lucide-react';
import Link from 'next/link';

import { Logo } from '../logo/logo';

interface FooterDetailsProps {
    locale: string;
}

export const FooterDetails = ({ locale }: FooterDetailsProps) => {
    const homeUrl = `/${locale}`;

    return (
        <div className="space-y-4">
            <Link className="flex items-center gap-2 font-bold hover:opacity-80 transition-opacity" href={homeUrl}>
                <Logo />

                <span>
                    <Trans>Budgie</Trans>
                </span>
            </Link>

            <p className="text-sm text-muted-foreground">
                <Trans>The privacy-first expense tracker that keeps your financial data exactly where it belongs—on your device.</Trans>
            </p>

            <div className="flex gap-4">
                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#">
                    <Github className="size-5" />

                    <span className="sr-only">
                        <Trans>GitHub</Trans>
                    </span>
                </Link>

                <Link className="text-muted-foreground hover:text-foreground transition-colors" href="#">
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
    );
};
