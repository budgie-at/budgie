import { FaqPageJsonLd } from '../../../generic/component/faq-page-json-ld/faq-page-json-ld';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { BlogFaqItem } from '../blog-faq-item/blog-faq-item';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly locale: string;
}

export const BlogFaqSection = ({ children, locale }: Props) => (
    <>
        <FaqPageJsonLd i18n={getI18nInstance(locale)} itemType={BlogFaqItem}>
            {children}
        </FaqPageJsonLd>
        <div className="space-y-6">{children}</div>
    </>
);
