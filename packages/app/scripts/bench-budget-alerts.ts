/* eslint-disable no-console */

const SCOPE_OVERALL = 'OVERALL';
const SCOPE_CATEGORY = 'CATEGORY';

const BUDGET_ALERT_THRESHOLDS = [80, 100] as const;

interface Budget {
    readonly id: number;
    readonly overallLimit: number;
}

interface CategoryLimit {
    readonly categoryId: number;
    readonly limitAmount: number;
}

interface CategorySpent {
    readonly categoryId: number;
    readonly spent: number;
}

interface Spent {
    readonly spentOverall: number;
    readonly spentByCategory: readonly CategorySpent[];
}

interface Trigger {
    readonly scope: typeof SCOPE_OVERALL | typeof SCOPE_CATEGORY;
    readonly categoryId: number | null;
    readonly threshold: number;
}

interface Alert {
    readonly id: number;
    readonly scope: typeof SCOPE_OVERALL | typeof SCOPE_CATEGORY;
    readonly categoryId: number | null;
    readonly threshold: number;
}

const createInMemoryRepo = () => {
    const store = new Map<string, Alert>();
    let nextId = 1;

    const keyFor = (budgetId: number, periodStartMs: number, scope: string, categoryId: number | null, threshold: number): string =>
        `${budgetId}|${periodStartMs}|${scope}|${String(categoryId)}|${threshold}`;

    return {
        createIfMissing(budgetId: number, periodStartMs: number, trigger: Trigger): Alert | null {
            const key = keyFor(budgetId, periodStartMs, trigger.scope, trigger.categoryId, trigger.threshold);
            if (store.has(key)) {
                return null;
            }
            const alert: Alert = { id: nextId++, scope: trigger.scope, categoryId: trigger.categoryId, threshold: trigger.threshold };
            store.set(key, alert);
            return alert;
        },
        findAll(): readonly Alert[] {
            return [...store.values()];
        }
    };
};

const crossesThreshold = (spent: number, limit: number, thresholdPercent: number): boolean =>
    limit > 0 && spent * 100 >= limit * thresholdPercent;

const computeTriggers = (budget: Budget, spent: Spent, categoryLimits: readonly CategoryLimit[]): Trigger[] => {
    const overallTriggers: Trigger[] = BUDGET_ALERT_THRESHOLDS.filter(threshold =>
        crossesThreshold(spent.spentOverall, budget.overallLimit, threshold)
    ).map(threshold => ({ scope: SCOPE_OVERALL as const, categoryId: null, threshold }));

    const spentByCategoryMap = new Map(spent.spentByCategory.map(entry => [entry.categoryId, entry.spent]));

    const categoryTriggers: Trigger[] = categoryLimits.flatMap(limit => {
        if (limit.limitAmount <= 0) {
            return [];
        }

        const categorySpent = spentByCategoryMap.get(limit.categoryId) ?? 0;

        return BUDGET_ALERT_THRESHOLDS.filter(threshold => crossesThreshold(categorySpent, limit.limitAmount, threshold)).map(
            threshold => ({ scope: SCOPE_CATEGORY as const, categoryId: limit.categoryId, threshold })
        );
    });

    return [...overallTriggers, ...categoryTriggers];
};

const BUDGET_ID = 1;
const PERIOD_START_MS = new Date('2026-05-01T00:00:00Z').getTime();
const CATEGORY_FOOD_ID = 10;
const CATEGORY_TRANSPORT_ID = 11;
const OVERALL_LIMIT = 1_000_000_000;
const FOOD_LIMIT = 300_000_000;
const TRANSPORT_LIMIT = 100_000_000;

const BUDGET: Budget = { id: BUDGET_ID, overallLimit: OVERALL_LIMIT };
const CATEGORY_LIMITS: readonly CategoryLimit[] = [
    { categoryId: CATEGORY_FOOD_ID, limitAmount: FOOD_LIMIT },
    { categoryId: CATEGORY_TRANSPORT_ID, limitAmount: TRANSPORT_LIMIT }
];

const makeSpent = (overallMicros: number, foodMicros: number, transportMicros: number): Spent => ({
    spentOverall: overallMicros,
    spentByCategory: [
        { categoryId: CATEGORY_FOOD_ID, spent: foodMicros },
        { categoryId: CATEGORY_TRANSPORT_ID, spent: transportMicros }
    ]
});

const containsAlert = (alerts: readonly Alert[], scope: string, categoryId: number | null, threshold: number): boolean =>
    alerts.some(alert => alert.scope === scope && alert.categoryId === categoryId && alert.threshold === threshold);

interface TestCase {
    readonly name: string;
    readonly spent: Spent;
    readonly expectedNewCount: number;
    readonly expectedAlerts: readonly { scope: string; categoryId: number | null; threshold: number }[];
}

const FOOD_80 = { scope: SCOPE_CATEGORY, categoryId: CATEGORY_FOOD_ID, threshold: 80 } as const;
const FOOD_100 = { scope: SCOPE_CATEGORY, categoryId: CATEGORY_FOOD_ID, threshold: 100 } as const;
const TRANSPORT_80 = { scope: SCOPE_CATEGORY, categoryId: CATEGORY_TRANSPORT_ID, threshold: 80 } as const;
const OVERALL_80 = { scope: SCOPE_OVERALL, categoryId: null, threshold: 80 } as const;
const OVERALL_100 = { scope: SCOPE_OVERALL, categoryId: null, threshold: 100 } as const;

const SNAPSHOT_AFTER_OVERALL_80 = [OVERALL_80, FOOD_80, FOOD_100] as const;
const SNAPSHOT_AFTER_OVERALL_100 = [OVERALL_80, OVERALL_100, FOOD_80, FOOD_100, TRANSPORT_80] as const;

const TEST_CASES: readonly TestCase[] = [
    {
        name: 'Below all thresholds — no alerts',
        spent: makeSpent(700_000_000, 200_000_000, 70_000_000),
        expectedNewCount: 0,
        expectedAlerts: []
    },
    {
        name: 'Food crosses 80% (244/300 = 81.3%) — one new category alert',
        spent: makeSpent(700_000_000, 244_000_000, 70_000_000),
        expectedNewCount: 1,
        expectedAlerts: [FOOD_80]
    },
    {
        name: 'Food crosses 100% (301/300) — 80 already persisted, 100 is new',
        spent: makeSpent(700_000_000, 301_000_000, 70_000_000),
        expectedNewCount: 1,
        expectedAlerts: [FOOD_80, FOOD_100]
    },
    {
        name: 'Overall crosses 80% (801/1000) — one new overall alert',
        spent: makeSpent(801_000_000, 301_000_000, 70_000_000),
        expectedNewCount: 1,
        expectedAlerts: SNAPSHOT_AFTER_OVERALL_80
    },
    {
        name: 'Re-evaluate same state — no new alerts (idempotent via createIfMissing)',
        spent: makeSpent(801_000_000, 301_000_000, 70_000_000),
        expectedNewCount: 0,
        expectedAlerts: SNAPSHOT_AFTER_OVERALL_80
    },
    {
        name: 'Transport crosses 80% (81/100) — one new transport alert',
        spent: makeSpent(801_000_000, 301_000_000, 81_000_000),
        expectedNewCount: 1,
        expectedAlerts: [...SNAPSHOT_AFTER_OVERALL_80, TRANSPORT_80]
    },
    {
        name: 'Overall crosses 100% (1001/1000) — one new 100% overall alert',
        spent: makeSpent(1_001_000_000, 301_000_000, 81_000_000),
        expectedNewCount: 1,
        expectedAlerts: SNAPSHOT_AFTER_OVERALL_100
    },
    {
        name: 'Boundary: exactly 80% (240/300 = 80.0%) — crosses threshold',
        spent: makeSpent(700_000_000, 240_000_000, 70_000_000),
        expectedNewCount: 0,
        expectedAlerts: SNAPSHOT_AFTER_OVERALL_100
    }
];

const run = (): void => {
    console.log('Running budget-alerts bench...');
    console.log('');
    console.log('Threshold-crossing math (stateful — each case builds on previous):');

    const repo = createInMemoryRepo();
    let allPass = true;

    for (const testCase of TEST_CASES) {
        const triggers = computeTriggers(BUDGET, testCase.spent, CATEGORY_LIMITS);
        const newAlerts = triggers
            .map(trigger => repo.createIfMissing(BUDGET_ID, PERIOD_START_MS, trigger))
            .filter((alert): alert is Alert => alert !== null);
        const allAlerts = repo.findAll();

        const newCountMatch = newAlerts.length === testCase.expectedNewCount;
        const allExpectedPresent = testCase.expectedAlerts.every(matcher =>
            containsAlert(allAlerts, matcher.scope, matcher.categoryId, matcher.threshold)
        );
        const pass = newCountMatch && allExpectedPresent;

        if (pass) {
            console.log(`  PASS: ${testCase.name}`);
        } else {
            console.log(`  FAIL: ${testCase.name}`);
            if (!newCountMatch) {
                console.log(`    expected ${testCase.expectedNewCount} new alerts, got ${newAlerts.length}`);
            }
            for (const matcher of testCase.expectedAlerts) {
                if (!containsAlert(allAlerts, matcher.scope, matcher.categoryId, matcher.threshold)) {
                    console.log(
                        `    missing alert: scope=${matcher.scope} categoryId=${String(matcher.categoryId)} threshold=${matcher.threshold}`
                    );
                }
            }
            allPass = false;
        }
    }

    console.log('');
    if (allPass) {
        console.log('PASS');
    } else {
        console.log('FAIL');
        process.exit(1);
    }
};

run();
