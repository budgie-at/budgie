/* oxlint-disable lingui/no-unlocalized-strings -- schema.org keys, not user-facing copy */
import { Children, type ReactNode, isValidElement } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { JsonLd } from '../../../generic/component/json-ld/json-ld';
import { getI18nInstance } from '../../../i18n/app-router-i18n';
import { extractTransMessage } from '../../../i18n/util/extract-trans-message.util';
import { BlogFaqItem, type BlogFaqItemProps } from '../blog-faq-item/blog-faq-item';

interface Props {
    readonly children: ReactNode;
    readonly locale: string;
}

export const BlogFaqSection = ({ children, locale }: Props) => {
    const i18n = getI18nInstance(locale);
    const items = Children.toArray(children)
        .filter(child => isValidElement<BlogFaqItemProps>(child))
        .filter(child => child.type === BlogFaqItem)
        .map(child => ({
            '@type': 'Question',
            name: extractTransMessage(child.props.question, i18n),
            acceptedAnswer: {
                '@type': 'Answer',
                text: extractTransMessage(child.props.children, i18n)
            }
        }));

    const faqSchema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items
    };

    return (
        <>
            {isNotEmptyArray(items) && <JsonLd data={faqSchema} />}
            <div className="space-y-6">{children}</div>
        </>
    );
};
