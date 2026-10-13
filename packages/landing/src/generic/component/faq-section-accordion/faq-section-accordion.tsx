import { useLingui } from '@lingui/react/macro';

import { Accordion } from '../../../ui/accordion/accordion';
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
            <Accordion className="w-full" collapsible type="single">
                {children}
            </Accordion>
        </>
    );
};
