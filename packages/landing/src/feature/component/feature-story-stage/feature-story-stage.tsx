'use client';

import { useEffect, useRef } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

import type { ReactNode } from 'react';

const readIndex = (element: Element) => Number(element.getAttribute('data-index') ?? 0);

const createActivator = (grid: HTMLElement) => {
    const updateAttribute = (element: HTMLElement, name: string, value: boolean) => {
        if (element.hasAttribute(name) !== value) {
            element.toggleAttribute(name, value);
        }
    };
    const steps = [...grid.querySelectorAll<HTMLElement>('[data-story-step]')];
    const stages = [...grid.querySelectorAll<HTMLElement>('[data-story-stage]')];
    const callouts = [...grid.querySelectorAll<HTMLElement>('[data-story-callout]')].map(callout => {
        const index = readIndex(callout);
        const peers = [...(callout.parentElement?.children ?? [])].filter(
            peer => peer.hasAttribute('data-story-callout') && readIndex(peer) === index
        );

        return { callout, index, slot: peers.indexOf(callout), slots: peers.length };
    });

    return (index: number, progress: number) => {
        const activeStageIndex = Math.max(0, ...stages.map(readIndex).filter(stageIndex => stageIndex <= index));

        steps.forEach(step => {
            updateAttribute(step, 'data-active', readIndex(step) === index);
            updateAttribute(step, 'data-passed', readIndex(step) <= index);
        });
        stages.forEach(stage => {
            updateAttribute(stage, 'data-active', readIndex(stage) === activeStageIndex);
        });
        callouts.forEach(({ callout, index: calloutIndex, slot, slots }) => {
            updateAttribute(callout, 'data-shown', calloutIndex <= index);
            updateAttribute(callout, 'data-focus', calloutIndex === index && slot === Math.min(slots - 1, Math.floor(progress * slots)));
        });
    };
};

interface Props {
    readonly count: number;
    readonly children: ReactNode;
}

export const FeatureStoryStage = ({ count, children }: Props) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const positions = Array.from({ length: count }, (_, position) => position);
    const gridStyle = { '--story-steps': count };

    useEffect(() => {
        const grid = gridRef.current;
        const panel = panelRef.current;

        if (!isDefined(grid) || !isDefined(panel)) {
            return emptyFn;
        }

        const activate = createActivator(grid);
        const update = () => {
            animationFrameRef.current = null;
            const gridBox = grid.getBoundingClientRect();
            const panelBox = panel.getBoundingClientRect();
            const position = ((panelBox.top - gridBox.top) / (gridBox.height - panelBox.height)) * count;
            const index = Math.min(count - 1, Math.floor(position));

            activate(index, position - index);
        };

        const scheduleUpdate = () => {
            if (!isDefined(animationFrameRef.current)) {
                animationFrameRef.current = window.requestAnimationFrame(update);
            }
        };

        grid.dataset.ready = '';
        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate);
        update();

        return () => {
            window.removeEventListener('scroll', scheduleUpdate);
            window.removeEventListener('resize', scheduleUpdate);
            if (isDefined(animationFrameRef.current)) {
                window.cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            grid.removeAttribute('data-ready');
        };
    }, [count]);

    return (
        <div className="story-grid" ref={gridRef} style={gridStyle}>
            <div className="story-panel" ref={panelRef}>
                <div aria-hidden="true" className="story-progress">
                    {positions.map(position => (
                        <span className="story-progress-segment" data-index={position} data-story-step key={position} />
                    ))}
                </div>
                {children}
            </div>
        </div>
    );
};
