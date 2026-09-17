import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const BUDGET_ALERT_MONITOR_SERVICE_URL = new URL(
    '../../../../../packages/app/src/budget/service/budget-alert-monitor.service.ts',
    import.meta.url
);

describe('sync/background-task-scheduling', () => {
    it('registers the budget monitor interval in minutes', () => {
        const serviceSource = readFileSync(BUDGET_ALERT_MONITOR_SERVICE_URL, 'utf8');

        expect(serviceSource).toContain('BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES = 15');
        expect(serviceSource).toContain('minimumInterval: BudgetAlertMonitorService.BACKGROUND_TASK_MINIMUM_INTERVAL_MINUTES');
        expect(serviceSource).not.toContain('MINIMUM_INTERVAL_SECONDS');
    });
});
