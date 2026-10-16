import { Trans } from '@lingui/react/macro';
import Link from 'next/link';

import type { ReactNode } from 'react';

interface Props {
    readonly locale: string;
    readonly current: ReactNode;
}

export const FeatureBreadcrumbs = ({ locale, current }: Props) => (
    <nav aria-label="breadcrumb" className="text-[0.8125rem] text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
            <li>
                <Link className="text-pillar font-medium hover:underline transition-colors" href={`/${locale}/features`}>
                    <Trans>Features</Trans>
                </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page">{current}</li>
        </ol>
    </nav>
);
