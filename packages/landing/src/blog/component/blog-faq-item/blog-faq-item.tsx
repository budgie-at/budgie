import { type ReactNode } from 'react';

interface Props {
    question: ReactNode;
    children: ReactNode;
}

export const BlogFaqItem = ({ question, children }: Props) => (
    <div className="space-y-2">
        <h4 className="font-semibold text-lg">{question}</h4>
        <p className="text-muted-foreground leading-relaxed">{children}</p>
    </div>
);
