import { Trans } from '@lingui/react/macro';
import { CheckCircle, Code, WifiOff } from 'reicon-react';

export const FeatureTrustStrip = () => (
    <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 md:mt-6 text-[0.9375rem] text-muted-foreground">
        <li className="flex items-center gap-1.5">
            <CheckCircle aria-hidden className="size-[1.05rem] shrink-0 text-pillar" />
            <Trans>Free, no account</Trans>
        </li>
        <li className="flex items-center gap-1.5">
            <WifiOff aria-hidden className="size-[1.05rem] shrink-0 text-pillar" />
            <Trans>Works offline</Trans>
        </li>
        <li className="flex items-center gap-1.5">
            <Code aria-hidden className="size-[1.05rem] shrink-0 text-pillar" />
            <Trans>Source-available</Trans>
        </li>
    </ul>
);
