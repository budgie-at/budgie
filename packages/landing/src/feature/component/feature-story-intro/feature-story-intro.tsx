import type { ReactNode } from 'react';

interface Props {
    readonly heading: ReactNode;
    readonly children: ReactNode;
}

export const FeatureStoryIntro = ({ heading, children }: Props) => (
    <div className="story-intro">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">{heading}</h2>
        <p className="mt-3 max-w-xl text-base md:text-lg text-muted-foreground text-pretty">{children}</p>
    </div>
);
