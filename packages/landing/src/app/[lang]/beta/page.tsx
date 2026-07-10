import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { BetaEmptyState } from '../../../beta/component/beta-empty-state/beta-empty-state';
import { BetaReleaseCard } from '../../../beta/component/beta-release-card/beta-release-card';
import { iosDevReleaseFetchApi } from '../../../beta/util/ios-dev-release-fetch.util';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return {
        title: i18n._(msg`Budgie iOS Beta Install`),
        // eslint-disable-next-line lingui/no-unlocalized-strings
        robots: 'noindex, follow'
    };
}

export default async function BetaPage(props: PageLangParam) {
    const { lang } = await props.params;
    initLingui(lang);
    const release = await iosDevReleaseFetchApi({ next: { revalidate: 60 } });

    return (
        <main className="flex-1">
            <section className="w-full py-20 md:py-32">
                <div className="container px-4 md:px-6 max-w-2xl">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        <Trans>Budgie iOS Beta</Trans>
                    </h1>
                    <p className="text-muted-foreground mb-8">
                        <Trans>Install the latest development build over-the-air on a registered iPhone.</Trans>
                    </p>
                    {isDefined(release) ? (
                        <BetaReleaseCard
                            locale={lang}
                            publishedAt={release.published_at}
                            releaseName={release.name}
                            releaseNotes={release.body}
                        />
                    ) : (
                        <BetaEmptyState />
                    )}
                </div>
            </section>
        </main>
    );
}
