import { type ReactNode } from 'react';

interface BlogFaqItemProps {
    readonly question: ReactNode;
    readonly children: ReactNode;
}

export const BlogFaqItem = ({ question, children }: BlogFaqItemProps) => (
    <div className="space-y-2">
        <h3 className="font-semibold text-lg">{question}</h3>
        <p className="text-muted-foreground leading-relaxed">{children}</p>
    </div>
);
