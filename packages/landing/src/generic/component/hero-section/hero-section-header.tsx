import { Trans } from '@lingui/react/macro';

import { Badge } from '../../../ui/badge';
import { WaitlistForm } from '../waitlist-form/waitlist-form';

export const HeroSectionHeader = () => (
    <div className="hero-copy">
        <Badge className="hero-enter hero-badge rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            <Trans>Private beta</Trans>
        </Badge>

        <h1 className="hero-enter hero-title text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
            <Trans>Your money. Your phone. Nobody else&apos;s server.</Trans>
        </h1>

        <p className="hero-enter hero-lede text-base md:text-xl text-muted-foreground text-balance">
            <Trans>Offline expense tracking that never phones home.</Trans>
        </p>

        <div className="hero-enter hero-action">
            <WaitlistForm initialCount={2847} variant="hero" />
        </div>
    </div>
);
