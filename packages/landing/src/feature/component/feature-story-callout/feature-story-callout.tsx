import type { ReactNode } from 'react';

const DEFAULT_CALLOUT_X = 0.93;

interface Props {
    readonly y: number;
    readonly x?: number;
    readonly index?: number;
    readonly labelY?: number;
    readonly children: ReactNode;
}

export const FeatureStoryCallout = ({ y, x = DEFAULT_CALLOUT_X, index, labelY = y, children }: Props) => {
    const anchor = { '--story-callout-x': x, '--story-callout-y': y, '--story-callout-label-y': labelY };

    return (
        <div className="story-callout" data-index={index} data-story-callout style={anchor}>
            <span aria-hidden="true" className="story-callout-pin" />
            <span className="story-callout-label">{children}</span>
        </div>
    );
};
