import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly children: ReactNode;
}

export const FeatureStoryPoint = ({ index, children }: Props) => {
    const rowPlacement = { '--story-row': index + 1 };

    return (
        <li className="story-step" data-index={index} data-story-step data-variant="POINT">
            <span aria-hidden="true" className="story-step-number" style={rowPlacement}>
                {index + 1}
            </span>
            <p className="story-step-body story-step-point" style={rowPlacement}>
                {children}
            </p>
        </li>
    );
};
