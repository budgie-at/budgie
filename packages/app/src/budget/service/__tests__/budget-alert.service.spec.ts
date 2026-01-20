/* eslint-disable import/order */
import {
    BudgetAlertEntityInterface,
    BudgetAlertSeverityEnum,
    BudgetAlertTypeEnum,
    BudgetEntityInterface,
    BudgetPeriodEnum,
    PRECISION,
    TransactionTypeEnum
} from '@budgie/contracts';

import { BudgetStatusEnum } from '../../enum/budget-status.enum';

const mockBudgetAlertRepository = {
    findActiveByBudgetId: jest.fn(),
    create: jest.fn()
};

const mockBudgetAlertSettingsRepository = {
    findByBudgetId: jest.fn()
};

const mockTransactionRepository = {
    getById: jest.fn()
};

const mockBudgetService = {
    getActive: jest.fn()
};

const mockBudgetCalculationService = {
    calculate: jest.fn()
};

const mockBudgetAlertNotificationService = {
    sendAlertNotification: jest.fn()
};

jest.mock('../../../@generic/drizzle/db/db', () => ({
    get budgetAlertRepository() {
        return mockBudgetAlertRepository;
    },
    get budgetAlertSettingsRepository() {
        return mockBudgetAlertSettingsRepository;
    },
    get transactionRepository() {
        return mockTransactionRepository;
    }
}));

jest.mock('../budget.service', () => ({
    get budgetService() {
        return mockBudgetService;
    }
}));

jest.mock('../budget-calculation.service', () => ({
    get budgetCalculationService() {
        return mockBudgetCalculationService;
    }
}));

jest.mock('../budget-alert-notification.service', () => ({
    get budgetAlertNotificationService() {
        return mockBudgetAlertNotificationService;
    }
}));

jest.mock('expo-background-task', () => ({
    registerTaskAsync: jest.fn()
}));

jest.mock('expo-task-manager', () => ({
    isTaskRegisteredAsync: jest.fn().mockResolvedValue(false)
}));

import { budgetAlertService } from '../budget-alert.service';

const createMockBudget = (overrides: Partial<BudgetEntityInterface> = {}): BudgetEntityInterface => ({
    id: 1,
    name: 'Test Budget',
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: 1,
    overallLimit: 1000 * PRECISION,
    rolloverEnabled: false,
    rolloverDeficitEnabled: false,
    rolloverAmount: 0,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
});

const createMockCalculationResult = (
    overrides: Partial<{
        overallPercentage: number;
        totalSpent: number;
        overallLimit: number;
        daysElapsed: number;
        daysInPeriod: number;
        categoryStatuses: Array<{
            category: { id: number; title: string };
            percentage: number;
            status: BudgetStatusEnum;
        }>;
    }> = {}
) => ({
    budget: createMockBudget(),
    overallLimit: overrides.overallLimit ?? 1000,
    effectiveLimit: overrides.overallLimit ?? 1000,
    rolloverAmount: 0,
    totalSpent: overrides.totalSpent ?? 500,
    overallRemaining: (overrides.overallLimit ?? 1000) - (overrides.totalSpent ?? 500),
    overallPercentage: overrides.overallPercentage ?? 50,
    overallStatus: BudgetStatusEnum.ON_TRACK,
    allocatedAmount: 0,
    unallocatedBuffer: 1000,
    categoryStatuses: overrides.categoryStatuses ?? [],
    incomeStatuses: [],
    totalExpectedIncome: 0,
    totalActualIncome: 0,
    incomeVariance: 0,
    daysInPeriod: overrides.daysInPeriod ?? 31,
    daysElapsed: overrides.daysElapsed ?? 15,
    dailyBudget: 32.26,
    expectedSpentByNow: 483.87,
    isOnPace: true,
    paceVariance: 0,
    warningCount: 0,
    unbudgetedSpending: [],
    totalUnbudgetedSpent: 0
});

const createMockAlert = (overrides: Partial<BudgetAlertEntityInterface> = {}): BudgetAlertEntityInterface => ({
    id: 1,
    budgetId: 1,
    categoryId: null,
    type: BudgetAlertTypeEnum.THRESHOLD,
    severity: BudgetAlertSeverityEnum.WARNING,
    percentage: 80,
    amount: null,
    transactionId: null,
    dismissedAt: null,
    periodStart: new Date('2024-01-01'),
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides
});

const createMockSettings = (
    overrides: Partial<{
        warningThreshold: number;
        exceededThreshold: number;
        largeExpenseThreshold: number;
        paceAlertsEnabled: boolean;
        predictiveAlertsEnabled: boolean;
        pushNotificationsEnabled: boolean;
    }> = {}
) => ({
    id: 1,
    budgetId: 1,
    warningThreshold: overrides.warningThreshold ?? 80,
    exceededThreshold: overrides.exceededThreshold ?? 100,
    largeExpenseThreshold: overrides.largeExpenseThreshold ?? 10,
    paceAlertsEnabled: overrides.paceAlertsEnabled ?? true,
    predictiveAlertsEnabled: overrides.predictiveAlertsEnabled ?? true,
    pushNotificationsEnabled: overrides.pushNotificationsEnabled ?? true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
});

describe('BudgetAlertService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockBudgetAlertSettingsRepository.findByBudgetId.mockResolvedValue(null);
        mockBudgetAlertRepository.findActiveByBudgetId.mockResolvedValue([]);
        mockBudgetAlertRepository.create.mockImplementation((input: Partial<BudgetAlertEntityInterface>) =>
            Promise.resolve(createMockAlert({ ...input, id: Math.floor(Math.random() * 1000) }))
        );
    });

    describe('threshold alerts', () => {
        it('triggers warning alert at 80 percent threshold', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult({ overallPercentage: 80 }));

            await budgetAlertService.checkThresholdAlerts(1);

            expect(mockBudgetAlertRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: BudgetAlertTypeEnum.THRESHOLD,
                    severity: BudgetAlertSeverityEnum.WARNING,
                    percentage: 80
                })
            );
        });

        it('triggers exceeded alert at 100 percent threshold', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult({ overallPercentage: 100 }));

            await budgetAlertService.checkThresholdAlerts(1);

            expect(mockBudgetAlertRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: BudgetAlertTypeEnum.THRESHOLD,
                    severity: BudgetAlertSeverityEnum.EXCEEDED,
                    percentage: 100
                })
            );
        });

        it('does not trigger alert below 80 percent threshold', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult({ overallPercentage: 79 }));

            await budgetAlertService.checkThresholdAlerts(1);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });

        it('respects custom threshold settings', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetAlertSettingsRepository.findByBudgetId.mockResolvedValue(createMockSettings({ warningThreshold: 70 }));
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult({ overallPercentage: 75 }));

            await budgetAlertService.checkThresholdAlerts(1);

            expect(mockBudgetAlertRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: BudgetAlertSeverityEnum.WARNING
                })
            );
        });
    });

    describe('pace alerts', () => {
        it('triggers pace alert when spending exceeds expected pace at milestone', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetCalculationService.calculate.mockResolvedValue(
                createMockCalculationResult({
                    daysElapsed: 8,
                    daysInPeriod: 31,
                    overallPercentage: 35
                })
            );

            await budgetAlertService.checkPaceAlerts(1);

            expect(mockBudgetAlertRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: BudgetAlertTypeEnum.PACE,
                    severity: BudgetAlertSeverityEnum.WARNING
                })
            );
        });

        it('does not trigger pace alert when on pace', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetCalculationService.calculate.mockResolvedValue(
                createMockCalculationResult({
                    daysElapsed: 8,
                    daysInPeriod: 31,
                    overallPercentage: 20
                })
            );

            await budgetAlertService.checkPaceAlerts(1);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });

        it('does not trigger pace alert when pace alerts are disabled', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetAlertSettingsRepository.findByBudgetId.mockResolvedValue(createMockSettings({ paceAlertsEnabled: false }));

            await budgetAlertService.checkPaceAlerts(1);

            expect(mockBudgetCalculationService.calculate).not.toHaveBeenCalled();
        });
    });

    describe('large expense detection', () => {
        it('triggers alert when expense exceeds percentage threshold of budget', async () => {
            const budget = createMockBudget({ overallLimit: 1000 * PRECISION });
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockTransactionRepository.getById.mockResolvedValue({
                id: 1,
                type: TransactionTypeEnum.EXPENSE,
                date: new Date('2024-01-15'),
                fromAccountId: 1,
                toAccountId: null,
                comment: null,
                entries: [{ id: 1, transactionId: 1, categoryId: 1, amount: 150 * PRECISION, amountInMainCurrency: 150 * PRECISION }],
                tags: [],
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            });

            await budgetAlertService.checkLargeExpenseAlert(1);

            expect(mockBudgetAlertRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: BudgetAlertTypeEnum.LARGE_EXPENSE,
                    transactionId: 1
                })
            );
        });

        it('does not trigger alert for expense below threshold', async () => {
            const budget = createMockBudget({ overallLimit: 1000 * PRECISION });
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockTransactionRepository.getById.mockResolvedValue({
                id: 1,
                type: TransactionTypeEnum.EXPENSE,
                date: new Date('2024-01-15'),
                fromAccountId: 1,
                toAccountId: null,
                comment: null,
                entries: [{ id: 1, transactionId: 1, categoryId: 1, amount: 50 * PRECISION, amountInMainCurrency: 50 * PRECISION }],
                tags: [],
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            });

            await budgetAlertService.checkLargeExpenseAlert(1);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });

        it('does not trigger alert for income transaction', async () => {
            mockTransactionRepository.getById.mockResolvedValue({
                id: 1,
                type: TransactionTypeEnum.INCOME,
                date: new Date('2024-01-15'),
                fromAccountId: null,
                toAccountId: 1,
                comment: null,
                entries: [{ id: 1, transactionId: 1, categoryId: 1, amount: 500 * PRECISION, amountInMainCurrency: 500 * PRECISION }],
                tags: [],
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            });

            await budgetAlertService.checkLargeExpenseAlert(1);

            expect(mockBudgetService.getActive).not.toHaveBeenCalled();
        });
    });

    describe('predictive alerts', () => {
        it('triggers alert when projected spending will exceed budget', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetCalculationService.calculate.mockResolvedValue(
                createMockCalculationResult({
                    totalSpent: 600,
                    overallLimit: 1000,
                    daysElapsed: 15,
                    daysInPeriod: 31
                })
            );

            await budgetAlertService.checkPredictiveAlerts(1);

            expect(mockBudgetAlertRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: BudgetAlertTypeEnum.PREDICTIVE
                })
            );
        });

        it('does not trigger alert when projection is within budget', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetCalculationService.calculate.mockResolvedValue(
                createMockCalculationResult({
                    totalSpent: 400,
                    overallLimit: 1000,
                    daysElapsed: 15,
                    daysInPeriod: 31
                })
            );

            await budgetAlertService.checkPredictiveAlerts(1);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });

        it('does not trigger alert when predictive alerts are disabled', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetAlertSettingsRepository.findByBudgetId.mockResolvedValue(createMockSettings({ predictiveAlertsEnabled: false }));

            await budgetAlertService.checkPredictiveAlerts(1);

            expect(mockBudgetCalculationService.calculate).not.toHaveBeenCalled();
        });

        it('does not trigger alert on first day of period', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetCalculationService.calculate.mockResolvedValue(
                createMockCalculationResult({
                    totalSpent: 100,
                    overallLimit: 1000,
                    daysElapsed: 0,
                    daysInPeriod: 31
                })
            );

            await budgetAlertService.checkPredictiveAlerts(1);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('duplicate alert prevention', () => {
        it('does not create warning alert if warning already exists for same category', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetAlertRepository.findActiveByBudgetId.mockResolvedValue([
                createMockAlert({
                    type: BudgetAlertTypeEnum.THRESHOLD,
                    severity: BudgetAlertSeverityEnum.WARNING,
                    categoryId: null
                })
            ]);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult({ overallPercentage: 85 }));

            await budgetAlertService.checkThresholdAlerts(1);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });

        it('creates exceeded alert even if warning already exists', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetAlertRepository.findActiveByBudgetId.mockResolvedValue([
                createMockAlert({
                    type: BudgetAlertTypeEnum.THRESHOLD,
                    severity: BudgetAlertSeverityEnum.WARNING,
                    categoryId: null
                })
            ]);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult({ overallPercentage: 100 }));

            await budgetAlertService.checkThresholdAlerts(1);

            expect(mockBudgetAlertRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    severity: BudgetAlertSeverityEnum.EXCEEDED
                })
            );
        });

        it('does not create exceeded alert if exceeded already exists', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetAlertRepository.findActiveByBudgetId.mockResolvedValue([
                createMockAlert({
                    type: BudgetAlertTypeEnum.THRESHOLD,
                    severity: BudgetAlertSeverityEnum.EXCEEDED,
                    categoryId: null
                })
            ]);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult({ overallPercentage: 110 }));

            await budgetAlertService.checkThresholdAlerts(1);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });

        it('does not create duplicate large expense alert for same transaction', async () => {
            const budget = createMockBudget({ overallLimit: 1000 * PRECISION });
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockTransactionRepository.getById.mockResolvedValue({
                id: 5,
                type: TransactionTypeEnum.EXPENSE,
                date: new Date('2024-01-15'),
                fromAccountId: 1,
                toAccountId: null,
                comment: null,
                entries: [{ id: 1, transactionId: 5, categoryId: 1, amount: 150 * PRECISION, amountInMainCurrency: 150 * PRECISION }],
                tags: [],
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            });
            mockBudgetAlertRepository.findActiveByBudgetId.mockResolvedValue([
                createMockAlert({
                    type: BudgetAlertTypeEnum.LARGE_EXPENSE,
                    transactionId: 5
                })
            ]);

            await budgetAlertService.checkLargeExpenseAlert(5);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });

        it('does not create duplicate predictive alert', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetAlertRepository.findActiveByBudgetId.mockResolvedValue([createMockAlert({ type: BudgetAlertTypeEnum.PREDICTIVE })]);
            mockBudgetCalculationService.calculate.mockResolvedValue(
                createMockCalculationResult({
                    totalSpent: 700,
                    overallLimit: 1000,
                    daysElapsed: 15,
                    daysInPeriod: 31
                })
            );

            await budgetAlertService.checkPredictiveAlerts(1);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('category-specific threshold alerts', () => {
        it('triggers category warning alert at threshold', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetCalculationService.calculate.mockResolvedValue(
                createMockCalculationResult({
                    overallPercentage: 50,
                    categoryStatuses: [
                        {
                            category: { id: 1, title: 'Groceries' },
                            percentage: 85,
                            status: BudgetStatusEnum.WARNING
                        }
                    ]
                })
            );

            await budgetAlertService.checkThresholdAlerts(1);

            expect(mockBudgetAlertRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    categoryId: 1,
                    severity: BudgetAlertSeverityEnum.WARNING
                })
            );
        });

        it('does not create duplicate category alert', async () => {
            const budget = createMockBudget();
            mockBudgetService.getActive.mockResolvedValue(budget);
            mockBudgetAlertRepository.findActiveByBudgetId.mockResolvedValue([
                createMockAlert({
                    type: BudgetAlertTypeEnum.THRESHOLD,
                    severity: BudgetAlertSeverityEnum.WARNING,
                    categoryId: 1
                })
            ]);
            mockBudgetCalculationService.calculate.mockResolvedValue(
                createMockCalculationResult({
                    overallPercentage: 50,
                    categoryStatuses: [
                        {
                            category: { id: 1, title: 'Groceries' },
                            percentage: 90,
                            status: BudgetStatusEnum.WARNING
                        }
                    ]
                })
            );

            await budgetAlertService.checkThresholdAlerts(1);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('no active budget', () => {
        it('does nothing for threshold alerts when no budget is active', async () => {
            mockBudgetService.getActive.mockResolvedValue(undefined);

            await budgetAlertService.checkThresholdAlerts(1);

            expect(mockBudgetCalculationService.calculate).not.toHaveBeenCalled();
        });

        it('does nothing for pace alerts when no budget is active', async () => {
            mockBudgetService.getActive.mockResolvedValue(undefined);

            await budgetAlertService.checkPaceAlerts(1);

            expect(mockBudgetCalculationService.calculate).not.toHaveBeenCalled();
        });

        it('does nothing for large expense alert when no budget is active', async () => {
            mockTransactionRepository.getById.mockResolvedValue({
                id: 1,
                type: TransactionTypeEnum.EXPENSE,
                date: new Date('2024-01-15'),
                fromAccountId: 1,
                toAccountId: null,
                comment: null,
                entries: [{ id: 1, transactionId: 1, categoryId: 1, amount: 500 * PRECISION, amountInMainCurrency: 500 * PRECISION }],
                tags: [],
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            });
            mockBudgetService.getActive.mockResolvedValue(undefined);

            await budgetAlertService.checkLargeExpenseAlert(1);

            expect(mockBudgetAlertRepository.create).not.toHaveBeenCalled();
        });

        it('does nothing for predictive alerts when no budget is active', async () => {
            mockBudgetService.getActive.mockResolvedValue(undefined);

            await budgetAlertService.checkPredictiveAlerts(1);

            expect(mockBudgetCalculationService.calculate).not.toHaveBeenCalled();
        });
    });
});
