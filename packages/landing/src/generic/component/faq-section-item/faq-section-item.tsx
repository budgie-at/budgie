import { AccordionContent } from '../../../ui/accordion/accordion-content';
import { AccordionItem } from '../../../ui/accordion/accordion-item';
import { AccordionTrigger } from '../../../ui/accordion/accordion-trigger';
import { Motion } from '../motion/motion';

interface Props {
    question: string;
    answer: string;
    index: number;
}

const itemInitialMotion = { opacity: 0, y: 10 };
const itemAnimatedMotion = { opacity: 1, y: 0 };
const viewportOnce = { once: true };

export const FaqSectionItem = ({ question, answer, index }: Props) => {
    const itemTransition = { duration: 0.3, delay: index * 0.05 };

    return (
        <Motion initial={itemInitialMotion} transition={itemTransition} viewport={viewportOnce} whileInView={itemAnimatedMotion}>
            <AccordionItem className="border-b border-border/40 py-2" value={`item-${question}`}>
                <AccordionTrigger className="text-left font-medium hover:no-underline">{question}</AccordionTrigger>

                <AccordionContent className="text-muted-foreground">{answer}</AccordionContent>
            </AccordionItem>
        </Motion>
    );
};
