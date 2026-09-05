import { FeatureStoryCallout } from '../feature-story-callout/feature-story-callout';
import { FeatureStoryClip } from '../feature-story-clip/feature-story-clip';
import { FeatureStoryIntro } from '../feature-story-intro/feature-story-intro';
import { FeatureStoryPoint } from '../feature-story-point/feature-story-point';
import { FeatureStoryShot } from '../feature-story-shot/feature-story-shot';
import { FeatureStoryStage } from '../feature-story-stage/feature-story-stage';
import { FeatureStoryStep } from '../feature-story-step/feature-story-step';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

const FeatureStoryRoot = ({ children }: Props) => (
    <section className="w-full py-12 md:py-20">
        <div className="container px-4 md:px-6 max-w-6xl">
            <FeatureStoryStage>{children}</FeatureStoryStage>
        </div>
    </section>
);

export const FeatureStory = Object.assign(FeatureStoryRoot, {
    Callout: FeatureStoryCallout,
    Clip: FeatureStoryClip,
    Intro: FeatureStoryIntro,
    Point: FeatureStoryPoint,
    Shot: FeatureStoryShot,
    Step: FeatureStoryStep
});
