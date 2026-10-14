import { Children, cloneElement, isValidElement } from 'react';

import { StoryDensityEnum } from '../../enum/story-density.enum';
import { groupFeatureStoryShots } from '../../utils/group-feature-story-shots.util';
import { FeatureStoryCallout } from '../feature-story-callout/feature-story-callout';
import { FeatureStoryIntro } from '../feature-story-intro/feature-story-intro';
import { FeatureStoryNotes } from '../feature-story-notes/feature-story-notes';
import { FeatureStoryPoint } from '../feature-story-point/feature-story-point';
import { FeatureStoryShot } from '../feature-story-shot/feature-story-shot';
import { FeatureStoryStage } from '../feature-story-stage/feature-story-stage';
import { FeatureStoryStep } from '../feature-story-step/feature-story-step';

import type { ReactNode } from 'react';

interface Props {
    readonly density?: StoryDensityEnum;
    readonly children: ReactNode;
}

const FeatureStoryRoot = ({ density = StoryDensityEnum.DEFAULT, children }: Props) => {
    const elements = Children.toArray(children).filter(child => isValidElement(child));
    const intro = elements.filter(element => element.type === FeatureStoryIntro);
    const steps = elements.filter(element => element.type === FeatureStoryStep || element.type === FeatureStoryPoint);
    const groups = groupFeatureStoryShots(children);

    return (
        <section className="story-section" {...(density === StoryDensityEnum.COMPACT && { 'data-density': density })}>
            <div className="container px-4 md:px-6 max-w-7xl">
                {intro}
                <FeatureStoryStage count={steps.length}>
                    <ol className="story-steps">{steps}</ol>
                    <div className="story-view">
                        <div className="story-device">
                            {groups.map(({ shot, callouts, focus }) => cloneElement(shot, { focus }, ...callouts))}
                        </div>
                        <div className="story-notes">
                            {groups.map(({ shot, callouts }) => (
                                <FeatureStoryNotes callouts={callouts} index={shot.props.index} key={shot.key} />
                            ))}
                        </div>
                    </div>
                </FeatureStoryStage>
            </div>
        </section>
    );
};

export const FeatureStory = Object.assign(FeatureStoryRoot, {
    Callout: FeatureStoryCallout,
    Intro: FeatureStoryIntro,
    Point: FeatureStoryPoint,
    Shot: FeatureStoryShot,
    Step: FeatureStoryStep
});
