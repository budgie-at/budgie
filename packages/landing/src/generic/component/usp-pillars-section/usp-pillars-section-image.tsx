import { useLingui } from '@lingui/react/macro';

import { AppShot } from '../app-shot/app-shot';

interface Props {
    locale: string;
}

export const UspPillarsSectionImage = ({ locale }: Props) => {
    const { t } = useLingui();

    return (
        <figure className="mx-auto mt-16 w-full max-w-[17rem] md:max-w-[19rem]">
            <AppShot
                alt={t`Budgie budget details screen with the monthly progress bar above the per-category limit cards`}
                locale={locale}
                scene="home-hero-2"
                slug="home-hero"
            />
        </figure>
    );
};
