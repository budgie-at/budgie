import type { ReactNode } from 'react';

const DEFAULT_CALLOUT_X = 0.93;

interface Props {
    readonly y: number;
    readonly x?: number;
    readonly index?: number;
    readonly children: ReactNode;
}

export const FeatureStoryCallout = ({ y, x = DEFAULT_CALLOUT_X, index, children }: Props) => {
    const dotPosition = { left: `${x * 100}%`, top: `${y * 100}%` };
    const leaderPosition = { top: `${y * 100}%` };

    return (
        <div className="story-callout" data-index={index} data-story-callout>
            <span aria-hidden="true" className="story-callout-pin">
                <span className="story-callout-dot" style={dotPosition} />
                <span className="story-callout-leader" style={leaderPosition} />
            </span>
            <span className="story-callout-label" style={leaderPosition}>
                <span aria-hidden="true" className="story-callout-number" />
                <span className="story-callout-text">{children}</span>
            </span>
        </div>
    );
};
