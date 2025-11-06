/* eslint-disable react/jsx-max-depth */

import { Trans } from '@lingui/react/macro';
import { notFound } from 'next/navigation';

import { isDefined } from '@rnw-community/shared';

import { Footer } from '../../../../generic/component/footer/footer';
import { Header } from '../../../../generic/component/header/header';
import { Motion } from '../../../../generic/component/motion/motion';
import { PageLangParam, initLingui } from '../../../../i18n/init-lingui';
import { LegalDataInterface } from '../../../../legal/interface/legal-data.interface';

import type { Metadata } from 'next';

interface Props extends PageLangParam {
    params: Promise<{ lang: string; slug: string }>;
}

const LEGAL_PAGES = ['privacy-policy', 'terms-of-service', 'license'];

// eslint-disable-next-line func-style
export async function generateStaticParams() {
    return LEGAL_PAGES.map(slug => ({ slug }));
}

const getLegalContent = async (slug: string, lang: string): Promise<LegalDataInterface> => {
    try {
        return (await import(`../../../../legal/content/${slug}/content.${lang}.mdx`)) as LegalDataInterface;
    } catch {
        // Fallback to English if translation doesn't exist
        return (await import(`../../../../legal/content/${slug}/content.en.mdx`)) as LegalDataInterface;
    }
};

// eslint-disable-next-line func-style
export async function generateMetadata(props: Props): Promise<Metadata> {
    const { slug, lang } = await props.params;

    initLingui(lang);

    const { metadata } = await getLegalContent(slug, lang);

    if (!isDefined(metadata)) {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        return { title: 'Legal Page' };
    }

    return {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        title: `${metadata.title} | Budgie`,
        // eslint-disable-next-line lingui/no-unlocalized-strings
        description: `${metadata.title} - Budgie Privacy-First Expense Tracker`
    };
}

export default async function LegalPage(props: Props) {
    const { slug, lang } = await props.params;

    initLingui(lang);

    const { default: Content, metadata } = await getLegalContent(slug, lang).catch(() => {
        notFound();
    });

    if (!isDefined(metadata)) {
        notFound();
    }

    return (
        <div className="flex min-h-dvh flex-col">
            <Header lang={lang} />

            <main className="flex-1">
                <section className="w-full py-20 md:py-32">
                    <div className="container px-4 md:px-6 max-w-4xl">
                        <Motion className="space-y-8">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{metadata.title}</h1>
                                <p className="text-muted-foreground">
                                    <Trans>Last Updated</Trans>: {metadata.lastUpdated}
                                </p>
                            </div>

                            <div className="prose prose-gray dark:prose-invert max-w-none">
                                <Content />
                            </div>
                        </Motion>
                    </div>
                </section>
            </main>

            <Footer lang={lang} />
        </div>
    );
}
