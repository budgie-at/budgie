import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly children: ReactNode;
}

export const FeatureStoryPoint = ({ index, children }: Props) => (
    <div className="story-step" data-index={index} data-story-step>
        <span aria-hidden="true" className="block h-1.5 w-1.5 rounded-full bg-primary/70" />
        <p className="mt-3 max-w-md text-base md:text-lg leading-relaxed text-pretty">{children}</p>
    </div>
);
