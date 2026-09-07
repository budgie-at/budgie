import { AccordionContent } from '../../../ui/accordion/accordion-content';
import { AccordionItem } from '../../../ui/accordion/accordion-item';
import { AccordionTrigger } from '../../../ui/accordion/accordion-trigger';

import type { ReactNode } from 'react';

interface Props {
    readonly question: ReactNode;
    readonly answer: ReactNode;
    readonly index: number;
}

export const FaqSectionItem = ({ question, answer, index }: Props) => (
    <AccordionItem className="border-b border-border/40 py-2" value={`item-${index}`}>
        <AccordionTrigger className="text-left font-medium hover:no-underline">{question}</AccordionTrigger>

        <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
    </AccordionItem>
);
