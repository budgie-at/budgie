'use client';

import { useEffect, useRef } from 'react';

import { emptyFn, isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { ReactNode } from 'react';

const STORY_DESKTOP_QUERY = '(min-width:1024px)';
const STORY_DESKTOP_ANCHOR = 0.5;
const STORY_PINNED_ANCHOR = 0.85;

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

const createActivator = (grid: HTMLElement, steps: HTMLElement[], stages: HTMLElement[]) => {
    const calloutIndexes = new Map(
        [...grid.querySelectorAll<HTMLElement>('[data-story-callout]')].map(callout => [callout, readCalloutIndex(callout)])
    );
    let activeIndex = -1;

    return (index: number) => {
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
};

const buildRootMargin = (anchor: number) => {
    const above = Math.round(anchor * 100) - 4;
    const below = 96 - Math.round(anchor * 100);

    return [`-${above}%`, '0px', `-${below}%`, '0px'].join(' ');
};

const observeStory = (steps: HTMLElement[], stages: HTMLElement[], anchor: number, activate: (index: number) => void) => {
    const resolveActiveIndex = () => {
        const anchorLine = window.innerHeight * anchor;
        const lastPassed = steps.filter(step => step.getBoundingClientRect().top <= anchorLine).at(-1);

        return isDefined(lastPassed) ? readIndex(lastPassed) : 0;
    };

    const observer = new IntersectionObserver(
        () => {
            activate(resolveActiveIndex());
        },
        { rootMargin: buildRootMargin(anchor), threshold: 0 }
    );

    [...steps, ...stages].forEach(element => {
        observer.observe(element);
    });

    return observer;
};

const attachStoryObserver = (steps: HTMLElement[], stages: HTMLElement[], activate: (index: number) => void) => {
    const desktopQuery = window.matchMedia(STORY_DESKTOP_QUERY);
    const resolveAnchor = () => (desktopQuery.matches ? STORY_DESKTOP_ANCHOR : STORY_PINNED_ANCHOR);
    let observer = observeStory(steps, stages, resolveAnchor(), activate);

    const reobserve = () => {
        observer.disconnect();
        observer = observeStory(steps, stages, resolveAnchor(), activate);
    };

    desktopQuery.addEventListener('change', reobserve);

    return () => {
        desktopQuery.removeEventListener('change', reobserve);
        observer.disconnect();
    };
};

const startStory = (grid: HTMLElement, saveData: boolean, activate: (index: number) => void) => {
    grid.dataset.ready = '';
    grid.toggleAttribute('data-save-data', saveData);
    activate(0);
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

        const steps = [...grid.querySelectorAll<HTMLElement>('[data-story-step]')];

        if (isEmptyArray(steps)) {
            return emptyFn;
        }

        const stages = [...grid.querySelectorAll<HTMLElement>('[data-story-stage]')];
        const activate = createActivator(grid, steps, stages);
        const stopObserving = attachStoryObserver(steps, stages, activate);

        startStory(grid, readSaveData(), activate);

        return () => {
            stopObserving();
            grid.removeAttribute('data-ready');
        };
    }, []);

    return (
        <div className="story-grid" ref={gridRef}>
            <div aria-hidden="true" className="story-scrim" />
            <div aria-hidden="true" className="story-rail">
                <span className="story-rail-progress" />
            </div>
            {children}
        </div>
    );
};
