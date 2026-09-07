import type { ReactNode } from 'react';

interface Props {
    readonly quote: ReactNode;
    readonly author: ReactNode;
    readonly role: ReactNode;
}

export const TestimonialCard = ({ quote, author, role }: Props) => (
    <figure className="flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6">
        <blockquote className="grow text-base leading-relaxed text-pretty">{quote}</blockquote>

        <figcaption className="mt-6 border-t border-border/60 pt-4 text-sm">
            <span className="block font-medium">{author}</span>
            <span className="block text-muted-foreground">{role}</span>
        </figcaption>
    </figure>
);
