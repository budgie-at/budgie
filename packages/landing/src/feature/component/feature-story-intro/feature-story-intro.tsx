import type { ReactNode } from 'react';

interface Props {
    readonly heading: ReactNode;
    readonly children: ReactNode;
}

export const FeatureStoryIntro = ({ heading, children }: Props) => (
    <div className="story-intro">
        <h2 className="story-intro-heading">{heading}</h2>
        <p className="story-intro-lede">{children}</p>
    </div>
);
