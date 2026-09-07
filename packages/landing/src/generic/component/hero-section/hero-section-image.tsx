import { useLingui } from '@lingui/react/macro';

import { AppClip } from '../app-clip/app-clip';
import { AppShot } from '../app-shot/app-shot';

interface Props {
    locale: string;
}

export const HeroSectionImage = ({ locale }: Props) => {
    const { t } = useLingui();
    const alt = t`Budgie showing a total balance, a monthly budget bar and bank, cash and savings accounts on one screen`;

    return (
        <div className="hero-stage hero-enter">
            <span aria-hidden="true" className="hero-bloom" />

            <div className="hero-frame">
                <AppClip
                    alt={alt}
                    fallback={<AppShot alt={alt} locale={locale} priority scene="home-hero-1" sizes="60vw" slug="home-hero" />}
                    locale={locale}
                    priority
                    scene="home-hero-clip-1"
                    slug="home-hero"
                />
            </div>
        </div>
    );
};
