'use client';

import { useEffect, useRef } from 'react';

import { emptyFn, isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { ReactNode } from 'react';

const STORY_BAND_INSET = 45;

const readSaveData = () => {
    const connection: unknown = Reflect.get(navigator, 'connection');

    return typeof connection === 'object' && isDefined(connection) && 'saveData' in connection && connection.saveData === true;
};

const readIndex = (element: Element) => Number(element.getAttribute('data-index') ?? 0);

const readCalloutIndex = (callout: HTMLElement) => {
    const ownIndex = callout.getAttribute('data-index');
    const stage = callout.closest('[data-story-stage]');

    if (isNotEmptyString(ownIndex)) {
        return Number(ownIndex);
    }

    return isDefined(stage) ? readIndex(stage) : 0;
};

const observeStory = (steps: HTMLElement[], stages: HTMLElement[], activate: (index: number) => void) => {
    const resolveActiveIndex = () => {
        const viewportCenter = window.innerHeight / 2;
        const lastPassed = steps.filter(step => step.getBoundingClientRect().top <= viewportCenter).at(-1);

        return isDefined(lastPassed) ? readIndex(lastPassed) : 0;
    };

    const observer = new IntersectionObserver(
        () => {
            activate(resolveActiveIndex());
        },
        { rootMargin: [`-${STORY_BAND_INSET}%`, '0px', `-${STORY_BAND_INSET}%`, '0px'].join(' '), threshold: 0 }
    );

    [...steps, ...stages].forEach(element => {
        observer.observe(element);
    });

    return observer;
};

interface Props {
    readonly children: ReactNode;
}

export const FeatureStoryStage = ({ children }: Props) => {
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const grid = gridRef.current;

        if (!isDefined(grid) || !('IntersectionObserver' in window)) {
            return emptyFn;
        }

        const steps = Array.from(grid.querySelectorAll<HTMLElement>('[data-story-step]'));
        const stages = Array.from(grid.querySelectorAll<HTMLElement>('[data-story-stage]'));

        if (isEmptyArray(steps)) {
            return emptyFn;
        }

        const calloutIndexes = new Map(
            Array.from(grid.querySelectorAll<HTMLElement>('[data-story-callout]')).map(callout => [callout, readCalloutIndex(callout)])
        );
        let activeIndex = -1;

        const activate = (index: number) => {
            if (index === activeIndex) {
                return;
            }

            activeIndex = index;

            const activeStageIndex = Math.max(...stages.map(readIndex).filter(stageIndex => stageIndex <= index));

            steps.forEach(step => {
                step.toggleAttribute('data-active', readIndex(step) === index);
            });
            stages.forEach(stage => {
                stage.toggleAttribute('data-active', readIndex(stage) === activeStageIndex);
            });
            calloutIndexes.forEach((calloutIndex, callout) => {
                callout.toggleAttribute('data-shown', calloutIndex <= index);
            });
        };

        const observer = observeStory(steps, stages, activate);

        grid.dataset.ready = '';
        grid.toggleAttribute('data-save-data', readSaveData());
        activate(0);

        return () => {
            observer.disconnect();
            grid.removeAttribute('data-ready');
        };
    }, []);

    return (
        <div className="story-grid" ref={gridRef}>
            <div aria-hidden="true" className="story-rail">
                <span className="story-rail-progress" />
            </div>
            {children}
        </div>
    );
};
