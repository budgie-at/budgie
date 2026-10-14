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
    const pinPosition = { left: `${x * 100}%`, top: `${y * 100}%` };
    const labelPosition = { top: `${labelY * 100}%`, '--story-callout-x': x, '--story-callout-shift': y - labelY };

    return (
        <div className="story-callout" data-index={index} data-story-callout>
            <span aria-hidden="true" className="story-callout-pin" style={pinPosition} />
            <span className="story-callout-label" style={labelPosition}>
                {children}
            </span>
        </div>
    );
};
