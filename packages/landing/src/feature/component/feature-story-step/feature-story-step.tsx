import type { ReactNode } from 'react';

interface Props {
    readonly index: number;
    readonly title: ReactNode;
    readonly children: ReactNode;
}

export const FeatureStoryStep = ({ index, title, children }: Props) => (
    <div className="story-step" data-index={index} data-story-step>
        <span aria-hidden="true" className="story-step-ordinal">
            <span className="story-step-rule" />
            {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="story-step-title">{title}</h3>
        <p className="story-step-body">{children}</p>
    </div>
);
