import { msg } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Suspense } from 'react';

import { BetaReleaseSection } from '../../../beta/component/beta-release-section/beta-release-section';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';
import { Card } from '../../../ui/card/card';
import { CardContent } from '../../../ui/card/card-content';

import type { Metadata } from 'next';

// eslint-disable-next-line func-style
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return {
        title: i18n._(msg`Budgie iOS Beta Install`),
        // oxlint-disable-next-line lingui/no-unlocalized-strings
        robots: 'noindex, follow'
    };
}

export default async function BetaPage(props: PageLangParam) {
    const { lang } = await props.params;
    initLingui(lang);

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
                    <Suspense
                        fallback={
                            <Card>
                                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                                    <Trans>Checking for the latest build&hellip;</Trans>
                                </CardContent>
                            </Card>
                        }
                    >
                        <BetaReleaseSection locale={lang} />
                    </Suspense>
                </div>
            </section>
        </main>
    );
}
