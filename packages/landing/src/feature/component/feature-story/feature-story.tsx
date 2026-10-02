import { StoryDensityEnum } from '../../enum/story-density.enum';
import { FeatureStoryCallout } from '../feature-story-callout/feature-story-callout';
import { FeatureStoryClip } from '../feature-story-clip/feature-story-clip';
import { FeatureStoryIntro } from '../feature-story-intro/feature-story-intro';
import { FeatureStoryPoint } from '../feature-story-point/feature-story-point';
import { FeatureStoryShot } from '../feature-story-shot/feature-story-shot';
import { FeatureStoryStage } from '../feature-story-stage/feature-story-stage';
import { FeatureStoryStep } from '../feature-story-step/feature-story-step';

import type { ReactNode } from 'react';

interface Props {
    readonly density?: StoryDensityEnum;
    readonly children: ReactNode;
}

const FeatureStoryRoot = ({ density = StoryDensityEnum.DEFAULT, children }: Props) => (
    <section className="w-full py-16 md:py-24" {...(density === StoryDensityEnum.COMPACT && { 'data-density': density })}>
        <div className="container px-4 md:px-6 max-w-7xl">
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
