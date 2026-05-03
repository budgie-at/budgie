import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import type { ReactNode } from 'react';

interface Props {
    readonly locale: string;
    readonly current: ReactNode;
}

export const FeatureBreadcrumbs = ({ locale, current }: Props) => (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
            <li>
                <Link className="hover:text-foreground transition-colors" href={`/${locale}`}>
                    <Trans>Home</Trans>
                </Link>
            </li>
            <li aria-hidden>›</li>
            <li>
                <Link className="hover:text-foreground transition-colors" href={`/${locale}/features`}>
                    <Trans>Features</Trans>
                </Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page" className="text-foreground font-medium">
                {current}
            </li>
        </ol>
    </nav>
);
