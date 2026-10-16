import { Children, cloneElement, isValidElement } from 'react';

import { isNotEmptyArray } from '@rnw-community/shared';

import { FeatureStoryShot } from '../component/feature-story-shot/feature-story-shot';

import type { FeatureStoryCallout } from '../component/feature-story-callout/feature-story-callout';
import type { FeatureStoryShotGroupInterface } from '../interface/feature-story-shot-group.interface';
import type { ComponentProps, ReactNode } from 'react';

const LABEL_MIN_GAP = 0.06;
const DEFAULT_FOCUS = 0.5;

export const groupFeatureStoryShots = (children: ReactNode): FeatureStoryShotGroupInterface[] => {
    const shots = Children.toArray(children).flatMap(child =>
        isValidElement<ComponentProps<typeof FeatureStoryShot>>(child) && child.type === FeatureStoryShot ? [child] : []
    );
    const groups = shots.filter((shot, position) => position === 0 || shots[position - 1]?.props.scene !== shot.props.scene);

    return groups.map(shot => {
        const run = shots.slice(shots.indexOf(shot));
        const nextScene = run.findIndex(candidate => candidate.props.scene !== shot.props.scene);
        const sameScene = nextScene === -1 ? run : run.slice(0, nextScene);
        const callouts = sameScene.flatMap(member =>
            Children.toArray(member.props.children).flatMap(child =>
                isValidElement<ComponentProps<typeof FeatureStoryCallout>>(child)
                    ? [{ element: child, index: child.props.index ?? member.props.index }]
                    : []
            )
        );
        const labelYs = [...callouts]
            .sort((left, right) => left.element.props.y - right.element.props.y)
            .reduce<Map<number, number>>((placed, callout) => {
                const previous = Math.max(-LABEL_MIN_GAP, ...placed.values());

                return placed.set(callouts.indexOf(callout), Math.max(callout.element.props.y, previous + LABEL_MIN_GAP));
            }, new Map());
        const focus = isNotEmptyArray(callouts)
            ? callouts.reduce((sum, callout) => sum + callout.element.props.y, 0) / callouts.length
            : DEFAULT_FOCUS;

        return {
            shot,
            focus,
            callouts: callouts.map((callout, position) =>
                cloneElement(callout.element, {
                    key: `${shot.props.index}-${position}`,
                    index: callout.index,
                    labelY: labelYs.get(position)
                })
            )
        };
    });
};
