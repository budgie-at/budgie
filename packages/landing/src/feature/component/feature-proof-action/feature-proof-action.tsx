import Link from 'next/link';

import { Button } from '../../../ui/button';

import type { ReactNode } from 'react';

interface Props {
    readonly href: string;
    readonly children: ReactNode;
}

export const FeatureProofAction = ({ href, children }: Props) => (
    <Button asChild className="feature-proof-action rounded-full" size="lg">
        <Link href={href}>{children}</Link>
    </Button>
);
