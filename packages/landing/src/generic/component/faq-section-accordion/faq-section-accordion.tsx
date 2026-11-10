import { useLingui } from '@lingui/react/macro';

import { FaqPageJsonLd } from '../faq-page-json-ld/faq-page-json-ld';
import { FaqSectionItem } from '../faq-section-item/faq-section-item';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FaqSectionAccordion = ({ children }: Props) => {
    const { i18n } = useLingui();

    return (
        <>
            <FaqPageJsonLd i18n={i18n} itemType={FaqSectionItem}>
                {children}
            </FaqPageJsonLd>
            <div className="w-full">{children}</div>
        </>
    );
};
