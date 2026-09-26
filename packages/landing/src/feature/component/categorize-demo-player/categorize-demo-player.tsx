'use client';

/* oxlint-disable lingui/no-unlocalized-strings */
import { RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import type { ReactNode } from 'react';

const STATIC_QUERY = '(prefers-reduced-motion:reduce)';
const START_THRESHOLD = 0.6;
const RAW_ROW_STAGGER_MS = 45;
const RAW_ROW_SCALE = 0.94;
const GROUP_AT_MS = 900;
const LIGHT_AT_MS = 2300;
const PRESS_AT_MS = 3900;
const ACCEPT_AT_MS = 4050;
const SHIFT_AT_MS = 4600;
const MOVE_PRESS_AT_MS = 5500;
const MOVE_AT_MS = 5650;
const DONE_AT_MS = 6200;
const COUNT_TICK_MS = 80;
const PHASES: readonly (readonly [number, string])[] = [
    [GROUP_AT_MS, 'data-grouped'],
    [LIGHT_AT_MS, 'data-lit'],
    [PRESS_AT_MS, 'data-pressed'],
    [ACCEPT_AT_MS, 'data-accepted'],
    [SHIFT_AT_MS, 'data-shifted'],
    [MOVE_PRESS_AT_MS, 'data-moving'],
    [MOVE_AT_MS, 'data-moved'],
    [DONE_AT_MS, 'data-done']
];

interface Props {
    readonly replay: ReactNode;
    readonly children: ReactNode;
}

const readTotal = (panel: HTMLElement) => Number(panel.querySelector<HTMLElement>('[data-cdemo-count]')?.dataset.total ?? 0);

const writeCount = (panel: HTMLElement, done: number) => {
    const count = panel.querySelector<HTMLElement>('[data-cdemo-count]');
    const bar = panel.querySelector<HTMLElement>('[data-cdemo-progress]');
    const total = readTotal(panel);

    if (isDefined(count)) {
        count.textContent = String(total - done);
    }

    if (isDefined(bar) && total > 0) {
        bar.style.transform = `scaleX(${done / total})`;
    }
};

const collapseRawRows = (panel: HTMLElement) => {
    panel.querySelectorAll<HTMLElement>('[data-cdemo-dy]').forEach((row, index) => {
        row.style.transitionDelay = `${index * RAW_ROW_STAGGER_MS}ms`;
        row.style.transform = `translateY(${row.dataset.cdemoDy ?? 0}rem) scale(${RAW_ROW_SCALE})`;
    });
};

const resetPanel = (panel: HTMLElement) => {
    PHASES.forEach(([, attribute]) => void panel.removeAttribute(attribute));
    panel.querySelectorAll<HTMLElement>('[data-cdemo-dy]').forEach(row => {
        row.style.removeProperty('transform');
        row.style.removeProperty('transition-delay');
    });
    writeCount(panel, 0);
};

const buildCountTicks = (total: number): (readonly [number, number])[] => [
    ...Array.from({ length: Math.max(total - 1, 0) }, (_, index): readonly [number, number] => [
        ACCEPT_AT_MS + (index + 1) * COUNT_TICK_MS,
        index + 1
    ]),
    [MOVE_AT_MS, total]
];

export const CategorizeDemoPlayer = ({ replay, children }: Props) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const timersRef = useRef<number[]>([]);

    const play = () => {
        const panel = panelRef.current;

        if (!isDefined(panel)) {
            return;
        }

        const applyPhase = (attribute: string) => {
            if (attribute === 'data-grouped') {
                collapseRawRows(panel);
            }

            panel.setAttribute(attribute, '');
        };

        timersRef.current = [
            ...PHASES.map(([delay, attribute]) => window.setTimeout(applyPhase, delay, attribute)),
            ...buildCountTicks(readTotal(panel)).map(([delay, done]) => window.setTimeout(writeCount, delay, panel, done))
        ];
    };

    const stop = () => {
        timersRef.current.forEach(timer => void window.clearTimeout(timer));
        timersRef.current = [];
    };

    const handleReplay = () => {
        const root = rootRef.current;
        const panel = panelRef.current;

        if (!isDefined(root) || !isDefined(panel)) {
            return;
        }

        stop();
        root.setAttribute('data-resetting', '');
        resetPanel(panel);
        root.getBoundingClientRect();
        root.removeAttribute('data-resetting');
        play();
    };

    useEffect(() => {
        const panel = panelRef.current;

        if (!isDefined(panel) || window.matchMedia(STATIC_QUERY).matches) {
            return stop;
        }

        const observer = new IntersectionObserver(
            entries => {
                if (!entries.some(entry => entry.isIntersecting)) {
                    return;
                }

                observer.disconnect();

                if (isEmptyArray(timersRef.current)) {
                    play();
                }
            },
            { threshold: START_THRESHOLD }
        );

        observer.observe(panel);

        return () => {
            observer.disconnect();
            stop();
        };
    }, []);

    return (
        <div className="cdemo-root" ref={rootRef}>
            <div aria-hidden="true" className="cdemo" ref={panelRef}>
                {children}
            </div>
            <button className="cdemo-replay" onClick={handleReplay} type="button">
                <RotateCcw aria-hidden="true" size={14} />
                {replay}
            </button>
        </div>
    );
};
