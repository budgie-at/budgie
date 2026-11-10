import { Children, cloneElement, isValidElement } from 'react';

import { FeatureStoryPoint } from '../component/feature-story-point/feature-story-point';
import { FeatureStoryShot } from '../component/feature-story-shot/feature-story-shot';
import { FeatureStoryStep } from '../component/feature-story-step/feature-story-step';

import type { ReactNode } from 'react';

interface IndexedProps {
    readonly index?: number;
}

export const assignFeatureStoryIndexes = (children: ReactNode): ReactNode[] => {
    let stepCount = 0;

    return Children.toArray(children).map(child => {
        if (!isValidElement<IndexedProps>(child)) {
            return child;
        }

        if (child.type === FeatureStoryStep || child.type === FeatureStoryPoint) {
            stepCount += 1;

            return cloneElement(child, { index: stepCount - 1 });
        }

        return child.type === FeatureStoryShot ? cloneElement(child, { index: Math.max(0, stepCount - 1) }) : child;
    });
};
