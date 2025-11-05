import { AccordionContent } from '../ui/accordion/accordion-content';
import { AccordionItem } from '../ui/accordion/accordion-item';
import { AccordionTrigger } from '../ui/accordion/accordion-trigger';

interface FaqQuestionProps {
    readonly question: string;
    readonly answer: string;
}

export const FaqQuestion = ({ answer, question }: FaqQuestionProps) => (
    <AccordionItem className="border-b border-border/40 py-2" value={`item-${question}`}>
        <AccordionTrigger className="text-left font-medium hover:no-underline">{question}</AccordionTrigger>

        <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
    </AccordionItem>
);
