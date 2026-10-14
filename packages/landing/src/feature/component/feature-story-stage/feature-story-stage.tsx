'use client';

import { useEffect, useRef } from 'react';

import { emptyFn, isDefined, isEmptyArray } from '@rnw-community/shared';

import type { ReactNode } from 'react';

const STORY_ANCHOR = 0.5;

const readIndex = (element: Element) => Number(element.getAttribute('data-index') ?? 0);

const createActivator = (grid: HTMLElement) => {
    const steps = [...grid.querySelectorAll<HTMLElement>('[data-story-step]')];
    const stages = [...grid.querySelectorAll<HTMLElement>('[data-story-stage]')];
    const callouts = [...grid.querySelectorAll<HTMLElement>('[data-story-callout]')];
    let activeIndex = -1;

    return (index: number) => {
        if (index === activeIndex) {
            return;
        }

        activeIndex = index;

        const activeStageIndex = Math.max(0, ...stages.map(readIndex).filter(stageIndex => stageIndex <= index));

        steps.forEach(step => {
            step.toggleAttribute('data-active', readIndex(step) === index);
            step.toggleAttribute('data-passed', readIndex(step) <= index);
        });
        stages.forEach(stage => {
            stage.toggleAttribute('data-active', readIndex(stage) === activeStageIndex);
        });
        callouts.forEach(callout => {
            callout.toggleAttribute('data-shown', readIndex(callout) <= index);
        });
    };
};

const observeStory = (sentinels: HTMLElement[], activate: (index: number) => void) => {
    const resolveActiveIndex = () => {
        const anchorLine = window.innerHeight * STORY_ANCHOR;
        const lastPassed = sentinels.filter(sentinel => sentinel.getBoundingClientRect().top <= anchorLine).at(-1);

        return isDefined(lastPassed) ? readIndex(lastPassed) : 0;
    };

    const observer = new IntersectionObserver(
        () => {
            activate(resolveActiveIndex());
        },
        { rootMargin: ['-50%', '0px', '-49%', '0px'].join(' '), threshold: 0 }
    );

    sentinels.forEach(sentinel => {
        observer.observe(sentinel);
    });

    return observer;
};

interface Props {
    readonly count: number;
    readonly children: ReactNode;
}

export const FeatureStoryStage = ({ count, children }: Props) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const positions = Array.from({ length: count }, (_, position) => position);
    const gridStyle = { '--story-steps': count };

    useEffect(() => {
        const grid = gridRef.current;

        if (!isDefined(grid) || !('IntersectionObserver' in window)) {
            return emptyFn;
        }

        const sentinels = [...grid.querySelectorAll<HTMLElement>('[data-story-sentinel]')];

        if (isEmptyArray(sentinels)) {
            return emptyFn;
        }

        const activate = createActivator(grid);
        const observer = observeStory(sentinels, activate);

        grid.dataset.ready = '';
        activate(0);

        return () => {
            observer.disconnect();
            grid.removeAttribute('data-ready');
        };
    }, []);

    return (
        <div className="story-grid" ref={gridRef} style={gridStyle}>
            <div className="story-panel">
                <div aria-hidden="true" className="story-progress">
                    {positions.map(position => (
                        <span className="story-progress-segment" data-index={position} data-story-step key={position} />
                    ))}
                </div>
                {children}
            </div>
            {positions.map(position => {
                const sentinelStyle = { '--story-sentinel': position };

                return (
                    <span
                        aria-hidden="true"
                        className="story-sentinel"
                        data-index={position}
                        data-story-sentinel
                        key={position}
                        style={sentinelStyle}
                    />
                );
            })}
        </div>
    );
};
