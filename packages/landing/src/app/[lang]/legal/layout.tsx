import { msg } from '@lingui/core/macro';
import { ReactNode } from 'react';

import { Motion } from '../../../generic/component/motion/motion';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

import type { Metadata } from 'next';

interface LegalLayoutProps extends PageLangParam {
    children: ReactNode;
}

// eslint-disable-next-line func-style
export async function generateMetadata(props: LegalLayoutProps): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return {
        title: i18n._(msg`Legal`),
        // eslint-disable-next-line lingui/no-unlocalized-strings
        robots: 'noindex, nofollow'
    };
}

export default async function LegalLayout(props: LegalLayoutProps) {
    const { lang } = await props.params;

    initLingui(lang);

    return (
        <main className="flex-1">
            <section className="w-full py-20 md:py-32">
                <div className="container px-4 md:px-6 max-w-4xl">
                    <Motion className="prose prose-gray dark:prose-invert max-w-none">{props.children}</Motion>
                </div>
            </section>
        </main>
    );
}
