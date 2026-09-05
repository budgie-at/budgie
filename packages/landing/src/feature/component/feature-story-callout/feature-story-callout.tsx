import type { ReactNode } from 'react';

interface Props {
    readonly y: number;
    readonly index?: number;
    readonly children: ReactNode;
}

export const FeatureStoryCallout = ({ y, index, children }: Props) => {
    const bandPosition = { top: `${y * 100}%` };

    return (
        <div className="story-callout" data-index={index} data-story-callout style={bandPosition}>
            <span className="story-callout-band" />
            <span className="story-callout-label rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[0.68rem] lg:text-[0.72rem] font-medium leading-tight text-foreground shadow-sm backdrop-blur-sm">
                {children}
            </span>
        </div>
    );
};
