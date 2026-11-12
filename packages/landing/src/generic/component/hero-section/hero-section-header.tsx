import { Trans } from '@lingui/react/macro';

import { Badge } from '../../../ui/badge';
import { WaitlistVariantEnum } from '../../enum/waitlist-variant.enum';
import { GooglePlayBadge } from '../google-play-badge/google-play-badge';
import { WaitlistForm } from '../waitlist-form/waitlist-form';

interface Props {
    readonly lang: string;
}

export const HeroSectionHeader = ({ lang }: Props) => (
    <div className="hero-copy">
        <Badge className="hero-enter hero-badge rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            <Trans>Private beta</Trans>
        </Badge>

        <h1 className="hero-enter hero-title text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance">
            <Trans>Your money. Your phone. Not our server.</Trans>
        </h1>

        <p className="hero-enter hero-lede text-base md:text-xl text-muted-foreground text-balance">
            <Trans>Offline expense tracking with backups that never touch our servers.</Trans>
        </p>

        <div className="hero-enter hero-action">
            <WaitlistForm variant={WaitlistVariantEnum.HERO} />

            <div className="mt-4">
                <GooglePlayBadge lang={lang} />
            </div>
        </div>
    </div>
);
