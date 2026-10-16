import { useLingui } from '@lingui/react/macro';

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
                <AppShot alt={alt} locale={locale} priority scene="home-hero-1" sizes="(min-width: 1024px) 30vw, 52vw" slug="home-hero" />
            </div>
        </div>
    );
};
