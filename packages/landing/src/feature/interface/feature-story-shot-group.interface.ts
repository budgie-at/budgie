import type { FeatureStoryCallout } from '../component/feature-story-callout/feature-story-callout';
import type { FeatureStoryShot } from '../component/feature-story-shot/feature-story-shot';
import type { ComponentProps, ReactElement } from 'react';

export interface FeatureStoryShotGroupInterface {
    readonly shot: ReactElement<ComponentProps<typeof FeatureStoryShot>>;
    readonly callouts: readonly ReactElement<ComponentProps<typeof FeatureStoryCallout>>[];
    readonly focus: number;
}
