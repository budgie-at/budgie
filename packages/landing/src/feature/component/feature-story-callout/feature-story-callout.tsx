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
            <span className="story-callout-label">{children}</span>
        </div>
    );
};
