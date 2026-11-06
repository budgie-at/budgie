import * as Layer from 'effect/Layer';
import * as TestClock from 'effect/testing/TestClock';
import { afterEach, beforeEach, vi } from 'vitest';

import { TestClockLayer } from '../scenario/test-runtime';

export const createScenarioClockLayer = (timestamp: number) => {
    beforeEach(() => vi.useFakeTimers({ now: timestamp, toFake: ['Date'] }));

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    return TestClockLayer.pipe(Layer.provideMerge(Layer.effectDiscard(TestClock.setTime(timestamp))));
};
