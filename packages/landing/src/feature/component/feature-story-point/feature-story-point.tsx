import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly children: ReactNode;
}

export const FeatureStoryPoint = ({ index, children }: Props) => {
    const rowPlacement = { gridRowStart: index + 2 };

    return (
        <div className="story-step" data-index={index} data-story-step style={rowPlacement}>
            <div className="story-step-inner">
                <span aria-hidden="true" className="story-step-ordinal">
                    <span className="story-step-rule" />
                </span>
                <p className="story-step-body">{children}</p>
            </div>
        </div>
    );
};
