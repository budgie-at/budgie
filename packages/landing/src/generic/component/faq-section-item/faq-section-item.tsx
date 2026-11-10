import { ChevronDown } from 'reicon-react';

import type { ReactNode } from 'react';

interface Props {
    readonly question: ReactNode;
    readonly answer: ReactNode;
}

export const FaqSectionItem = ({ question, answer }: Props) => (
    <details className="group border-b border-border/40 py-2" name="home-faq">
        <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-left font-medium hover:underline [&::-webkit-details-marker]:hidden">
            <h3>{question}</h3>

            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
        </summary>

        <div className="pb-4 pt-0 text-sm text-muted-foreground">{answer}</div>
    </details>
);
