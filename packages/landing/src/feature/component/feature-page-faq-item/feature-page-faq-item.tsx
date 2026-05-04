import type { ReactNode } from 'react';

interface Props {
    readonly question: ReactNode;
    readonly answer: ReactNode;
}

export const FeaturePageFaqItem = ({ question, answer }: Props) => (
    <details className="group rounded-lg border border-border/60 bg-card p-4 md:p-5">
        <summary className="cursor-pointer list-none font-semibold flex items-center justify-between">
            <span>{question}</span>
            <span aria-hidden className="ml-4 transition-transform group-open:rotate-45 text-2xl leading-none">
                +
            </span>
        </summary>
        <div className="mt-3 text-muted-foreground">{answer}</div>
    </details>
);
