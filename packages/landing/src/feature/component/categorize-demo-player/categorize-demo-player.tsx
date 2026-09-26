'use client';

/* oxlint-disable lingui/no-unlocalized-strings */
import { RotateCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { ReactNode } from 'react';

const STATIC_QUERY = '(prefers-reduced-motion:reduce)';
const START_THRESHOLD = 0.6;
const START_DWELL_MS = 1200;
const RAW_ROW_STAGGER_MS = 60;
const RAW_ROW_SCALE = 0.94;
const GROUP_AT_MS = 600;
const LIGHT_AT_MS = 1700;
const PRESS_AT_MS = 2700;
const ACCEPT_AT_MS = 2850;
const CARD_EXIT_STAGGER_MS = 70;
const SHIFT_OVERLAP_MS = 180;
const SHIFT_AT_MS = ACCEPT_AT_MS + SHIFT_OVERLAP_MS;
const REWIND_AT_MS = 4600;
const REWIND_FADE_MS = 220;
const SETTLE_AT_MS = REWIND_AT_MS + REWIND_FADE_MS;
const PHASES: readonly (readonly [number, string])[] = [
    [GROUP_AT_MS, 'data-grouped'],
    [LIGHT_AT_MS, 'data-lit'],
    [PRESS_AT_MS, 'data-pressed'],
    [ACCEPT_AT_MS, 'data-accepted'],
    [SHIFT_AT_MS, 'data-shifted'],
    [REWIND_AT_MS, 'data-rewinding']
];
const REWOUND_PHASES = ['data-pressed', 'data-accepted', 'data-shifted'];

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

const buildCountTicks = (panel: HTMLElement): (readonly [number, number])[] =>
    Array.from(panel.querySelectorAll<HTMLElement>('.cdemo-card[data-count]')).reduce<(readonly [number, number])[]>(
        (ticks, card, index) => [
            ...ticks,
            [ACCEPT_AT_MS + index * CARD_EXIT_STAGGER_MS, (ticks.at(-1)?.[1] ?? 0) + Number(card.dataset.count)]
        ],
        []
    );

const collapseRawRows = (panel: HTMLElement) => {
    panel.querySelectorAll<HTMLElement>('[data-cdemo-dy]').forEach(row => {
        row.style.transitionDelay = `${Number(row.dataset.slot) * RAW_ROW_STAGGER_MS}ms`;
        row.style.transform = `translateY(${row.dataset.cdemoDy ?? 0}rem) scale(${RAW_ROW_SCALE})`;
    });
};

const withoutTransitions = (root: HTMLElement, apply: () => void) => {
    root.setAttribute('data-resetting', '');
    apply();
    root.getBoundingClientRect();
    root.removeAttribute('data-resetting');
};

const resetPanel = (panel: HTMLElement) => {
    PHASES.forEach(([, attribute]) => void panel.removeAttribute(attribute));
    panel.querySelectorAll<HTMLElement>('[data-cdemo-dy]').forEach(row => {
        row.style.removeProperty('transform');
        row.style.removeProperty('transition-delay');
    });
    writeCount(panel, 0);
};

const settlePanel = (root: HTMLElement, panel: HTMLElement) => {
    withoutTransitions(root, () => {
        REWOUND_PHASES.forEach(attribute => void panel.removeAttribute(attribute));
        writeCount(panel, 0);
    });
    panel.removeAttribute('data-rewinding');
};

export const CategorizeDemoPlayer = ({ replay, children }: Props) => {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const timersRef = useRef<number[]>([]);
    const observerRef = useRef<IntersectionObserver>(null);

    const stop = () => {
        timersRef.current.forEach(timer => void window.clearTimeout(timer));
        timersRef.current = [];
    };

    const play = () => {
        const root = rootRef.current;
        const panel = panelRef.current;

        if (!isDefined(root) || !isDefined(panel)) {
            return;
        }

        timersRef.current = [
            window.setTimeout(collapseRawRows, GROUP_AT_MS, panel),
            ...PHASES.map(([delay, attribute]) => window.setTimeout(() => void panel.setAttribute(attribute, ''), delay)),
            ...buildCountTicks(panel).map(([delay, done]) => window.setTimeout(writeCount, delay, panel, done)),
            window.setTimeout(settlePanel, SETTLE_AT_MS, root, panel)
        ];
    };

    const handleReplay = () => {
        const root = rootRef.current;
        const panel = panelRef.current;

        if (!isDefined(root) || !isDefined(panel)) {
            return;
        }

        observerRef.current?.disconnect();
        stop();
        withoutTransitions(root, () => void resetPanel(panel));
        play();
    };

    useEffect(() => {
        const panel = panelRef.current;

        if (!isDefined(panel) || window.matchMedia(STATIC_QUERY).matches) {
            return stop;
        }

        const observer = new IntersectionObserver(
            entries => {
                stop();

                if (!entries.some(entry => entry.isIntersecting)) {
                    return;
                }

                timersRef.current = [
                    window.setTimeout(() => {
                        observer.disconnect();
                        play();
                    }, START_DWELL_MS)
                ];
            },
            { threshold: START_THRESHOLD }
        );

        observerRef.current = observer;
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
