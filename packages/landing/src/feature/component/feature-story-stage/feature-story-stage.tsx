'use client';

import { useEffect, useRef } from 'react';

import { emptyFn, isDefined, isEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import type { ReactNode } from 'react';

const STORY_DESKTOP_QUERY = '(min-width:1024px)';
const STORY_STATIC_QUERY = '(prefers-reduced-motion:reduce)';
const STORY_DESKTOP_ANCHOR = 0.5;
const STORY_PINNED_ANCHOR = 0.85;
const STORY_PROGRESS_PROPERTY = '--story-progress';
const STORY_PROGRESS_STEPS = 400;
const STORY_MOTION_TARGETS = '.story-frame,.story-bloom,.story-rail-progress';

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
        Array.from(grid.querySelectorAll<HTMLElement>('[data-story-callout]')).map(callout => [callout, readCalloutIndex(callout)])
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

const supportsScrollTimeline = () => 'CSS' in window && CSS.supports('animation-timeline', 'view()');

const skipsScrollFallback = () => window.matchMedia(STORY_STATIC_QUERY).matches || readSaveData() || supportsScrollTimeline();

const trackStoryProgress = (grid: HTMLElement) => {
    const targets = Array.from(grid.querySelectorAll<HTMLElement>(STORY_MOTION_TARGETS));
    let lastProgress = -1;

    const update = () => {
        const bounds = grid.getBoundingClientRect();
        const span = bounds.height - window.innerHeight;
        const ratio = span > 0 ? -bounds.top / span : 0;
        const progress = Math.round(Math.min(1, Math.max(0, ratio)) * STORY_PROGRESS_STEPS) / STORY_PROGRESS_STEPS;

        if (progress === lastProgress) {
            return;
        }

        lastProgress = progress;
        targets.forEach(target => {
            target.style.setProperty(STORY_PROGRESS_PROPERTY, String(progress));
        });
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    grid.dataset.storyMotion = 'fallback';
    update();

    return () => {
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
        delete grid.dataset.storyMotion;
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

        const steps = Array.from(grid.querySelectorAll<HTMLElement>('[data-story-step]'));

        if (isEmptyArray(steps)) {
            return emptyFn;
        }

        const stages = Array.from(grid.querySelectorAll<HTMLElement>('[data-story-stage]'));
        const activate = createActivator(grid, steps, stages);
        const stopObserving = attachStoryObserver(steps, stages, activate);
        const stopProgress = skipsScrollFallback() ? emptyFn : trackStoryProgress(grid);

        startStory(grid, readSaveData(), activate);

        return () => {
            stopObserving();
            stopProgress();
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
