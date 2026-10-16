import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const FeatureStoryStep = ({ index, title, children }: Props) => {
    const rowPlacement = { '--story-row': index + 1 };

    return (
        <li className="story-step" data-index={index} data-story-step>
            <span aria-hidden="true" className="story-step-number" style={rowPlacement}>
                {index + 1}
            </span>
            <h3 className="story-step-title" style={rowPlacement}>
                {title}
            </h3>
            <p className="story-step-body">{children}</p>
        </li>
    );
};
