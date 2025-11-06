import { ReactNode } from 'react';

import { Footer } from '../../../generic/component/footer/footer';
import { Header } from '../../../generic/component/header/header';
import { Motion } from '../../../generic/component/motion/motion';
import { PageLangParam, initLingui } from '../../../i18n/init-lingui';

interface LegalLayoutProps extends PageLangParam {
    children: ReactNode;
}

export default async function LegalLayout(props: LegalLayoutProps) {
    const { lang } = await props.params;

    initLingui(lang);

    return (
        <div className="flex min-h-dvh flex-col">
            <Header lang={lang} />

            <main className="flex-1">
                <section className="w-full py-20 md:py-32">
                    <div className="container px-4 md:px-6 max-w-4xl">
                        <Motion className="prose prose-gray dark:prose-invert max-w-none">
                            {props.children}
                        </Motion>
                    </div>
                </section>
            </main>

            <Footer lang={lang} />
        </div>
    );
}
