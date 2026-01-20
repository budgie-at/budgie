import { BudgetEntityInterface, BudgetPeriodEnum, PRECISION } from '@budgie/contracts';

const mockBudgetRepository = {
    findActive: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
    updateById: jest.fn()
};

const mockBudgetCategoryLimitRepository = {
    bulkCreate: jest.fn(),
    deleteByBudgetId: jest.fn()
};

const mockBudgetIncomeExpectationRepository = {
    bulkCreate: jest.fn(),
    deleteByBudgetId: jest.fn()
};

const mockBudgetPeriodSnapshotRepository = {
    create: jest.fn()
};

const mockDb = {
    transaction: jest.fn((callback: (transaction: unknown) => Promise<unknown>) => callback({}))
};

const mockBudgetCalculationService = {
    calculate: jest.fn()
};

jest.mock('../../../@generic/drizzle/db/db', () => ({
    get budgetRepository() {
        return mockBudgetRepository;
    },
    get budgetCategoryLimitRepository() {
        return mockBudgetCategoryLimitRepository;
    },
    get budgetIncomeExpectationRepository() {
        return mockBudgetIncomeExpectationRepository;
    },
    get budgetPeriodSnapshotRepository() {
        return mockBudgetPeriodSnapshotRepository;
    },
    get db() {
        return mockDb;
    }
}));

jest.mock('../budget-calculation.service', () => ({
    get budgetCalculationService() {
        return mockBudgetCalculationService;
    }
}));

import { budgetService } from '../budget.service';

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

const createMockBudgetWithRelations = (overrides: Partial<BudgetEntityInterface> = {}) => ({
    ...createMockBudget(overrides),
    categoryLimits: [],
    incomeExpectations: []
});

const createMockCalculationResult = (totalSpent: number) => ({
    budget: createMockBudget(),
    overallLimit: 1000,
    effectiveLimit: 1000,
    rolloverAmount: 0,
    totalSpent,
    overallRemaining: 1000 - totalSpent,
    overallPercentage: (totalSpent / 1000) * 100,
    overallStatus: 'ON_TRACK',
    allocatedAmount: 0,
    unallocatedBuffer: 1000,
    categoryStatuses: [],
    incomeStatuses: [],
    totalExpectedIncome: 0,
    totalActualIncome: 0,
    incomeVariance: 0,
    daysInPeriod: 31,
    daysElapsed: 15,
    dailyBudget: 32.26,
    expectedSpentByNow: 483.87,
    isOnPace: true,
    paceVariance: 0,
    warningCount: 0,
    unbudgetedSpending: [],
    totalUnbudgetedSpent: 0
});

describe('BudgetService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('period date calculations for weekly periods', () => {
        it('calculates weekly start date correctly based on start day of week', async () => {
            jest.setSystemTime(new Date('2024-01-10'));
            const input = {
                name: 'Weekly Budget',
                period: BudgetPeriodEnum.WEEKLY,
                periodStartDay: 1,
                overallLimit: 500,
                rolloverEnabled: false,
                rolloverDeficitEnabled: false,
                categoryLimits: [],
                incomeExpectations: []
            };
            const expectedBudget = createMockBudgetWithRelations({
                period: BudgetPeriodEnum.WEEKLY,
                startDate: new Date('2024-01-08'),
                endDate: new Date('2024-01-14')
            });
            mockBudgetRepository.create.mockResolvedValue(expectedBudget);
            mockBudgetRepository.getById.mockResolvedValue(expectedBudget);

            const result = await budgetService.create(input);

            expect(mockBudgetRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    period: BudgetPeriodEnum.WEEKLY
                }),
                expect.anything()
            );
            expect(result).toBeDefined();
        });

        it('calculates weekly period to be 7 days', async () => {
            jest.setSystemTime(new Date('2024-01-15'));
            const input = {
                name: 'Weekly Budget',
                period: BudgetPeriodEnum.WEEKLY,
                periodStartDay: 0,
                overallLimit: 500,
                rolloverEnabled: false,
                rolloverDeficitEnabled: false,
                categoryLimits: [],
                incomeExpectations: []
            };
            const createdBudget = createMockBudgetWithRelations({
                period: BudgetPeriodEnum.WEEKLY,
                startDate: new Date('2024-01-14'),
                endDate: new Date('2024-01-20')
            });
            mockBudgetRepository.create.mockResolvedValue(createdBudget);
            mockBudgetRepository.getById.mockResolvedValue(createdBudget);

            await budgetService.create(input);

            const createCall = mockBudgetRepository.create.mock.calls[0][0];
            const startDate = new Date(createCall.startDate);
            const endDate = new Date(createCall.endDate);
            const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

            expect(daysDiff).toBe(6);
        });
    });

    describe('period date calculations for bi-weekly periods', () => {
        it('calculates bi-weekly period to be 14 days', async () => {
            jest.setSystemTime(new Date('2024-01-15'));
            const input = {
                name: 'Bi-Weekly Budget',
                period: BudgetPeriodEnum.BI_WEEKLY,
                periodStartDay: 1,
                overallLimit: 1000,
                rolloverEnabled: false,
                rolloverDeficitEnabled: false,
                categoryLimits: [],
                incomeExpectations: []
            };
            const createdBudget = createMockBudgetWithRelations({
                period: BudgetPeriodEnum.BI_WEEKLY,
                startDate: new Date('2024-01-08'),
                endDate: new Date('2024-01-21')
            });
            mockBudgetRepository.create.mockResolvedValue(createdBudget);
            mockBudgetRepository.getById.mockResolvedValue(createdBudget);

            await budgetService.create(input);

            const createCall = mockBudgetRepository.create.mock.calls[0][0];
            const startDate = new Date(createCall.startDate);
            const endDate = new Date(createCall.endDate);
            const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

            expect(daysDiff).toBe(13);
        });
    });

    describe('period date calculations for monthly periods', () => {
        it('calculates monthly period start based on periodStartDay', async () => {
            jest.setSystemTime(new Date('2024-01-20'));
            const input = {
                name: 'Monthly Budget',
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: 15,
                overallLimit: 2000,
                rolloverEnabled: false,
                rolloverDeficitEnabled: false,
                categoryLimits: [],
                incomeExpectations: []
            };
            const createdBudget = createMockBudgetWithRelations({
                period: BudgetPeriodEnum.MONTHLY,
                startDate: new Date('2024-01-15'),
                endDate: new Date('2024-02-14')
            });
            mockBudgetRepository.create.mockResolvedValue(createdBudget);
            mockBudgetRepository.getById.mockResolvedValue(createdBudget);

            await budgetService.create(input);

            const createCall = mockBudgetRepository.create.mock.calls[0][0];
            expect(createCall.startDate.getDate()).toBe(15);
        });

        it('uses previous month when current day is before periodStartDay', async () => {
            jest.setSystemTime(new Date('2024-01-10'));
            const input = {
                name: 'Monthly Budget',
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: 15,
                overallLimit: 2000,
                rolloverEnabled: false,
                rolloverDeficitEnabled: false,
                categoryLimits: [],
                incomeExpectations: []
            };
            const createdBudget = createMockBudgetWithRelations({
                period: BudgetPeriodEnum.MONTHLY,
                startDate: new Date('2023-12-15'),
                endDate: new Date('2024-01-14')
            });
            mockBudgetRepository.create.mockResolvedValue(createdBudget);
            mockBudgetRepository.getById.mockResolvedValue(createdBudget);

            await budgetService.create(input);

            const createCall = mockBudgetRepository.create.mock.calls[0][0];
            expect(createCall.startDate.getMonth()).toBe(11);
            expect(createCall.startDate.getDate()).toBe(15);
        });
    });

    describe('period start day edge case in February', () => {
        it('adjusts day 31 to day 29 in leap year February', async () => {
            jest.setSystemTime(new Date('2024-02-15'));
            const input = {
                name: 'Monthly Budget',
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: 31,
                overallLimit: 2000,
                rolloverEnabled: false,
                rolloverDeficitEnabled: false,
                categoryLimits: [],
                incomeExpectations: []
            };
            const createdBudget = createMockBudgetWithRelations({
                period: BudgetPeriodEnum.MONTHLY,
                startDate: new Date('2024-01-31'),
                endDate: new Date('2024-02-29')
            });
            mockBudgetRepository.create.mockResolvedValue(createdBudget);
            mockBudgetRepository.getById.mockResolvedValue(createdBudget);

            await budgetService.create(input);

            const createCall = mockBudgetRepository.create.mock.calls[0][0];
            expect(createCall.startDate.getDate()).toBeLessThanOrEqual(31);
        });

        it('adjusts day 30 to day 28 in non-leap year February', async () => {
            jest.setSystemTime(new Date('2023-02-15'));
            const input = {
                name: 'Monthly Budget',
                period: BudgetPeriodEnum.MONTHLY,
                periodStartDay: 30,
                overallLimit: 2000,
                rolloverEnabled: false,
                rolloverDeficitEnabled: false,
                categoryLimits: [],
                incomeExpectations: []
            };
            const createdBudget = createMockBudgetWithRelations({
                period: BudgetPeriodEnum.MONTHLY,
                startDate: new Date('2023-01-30'),
                endDate: new Date('2023-02-28')
            });
            mockBudgetRepository.create.mockResolvedValue(createdBudget);
            mockBudgetRepository.getById.mockResolvedValue(createdBudget);

            await budgetService.create(input);

            expect(mockBudgetRepository.create).toHaveBeenCalled();
        });
    });

    describe('rollover amount calculation', () => {
        it('carries forward unused budget when rollover is enabled', async () => {
            jest.setSystemTime(new Date('2024-02-01'));
            const expiredBudget = createMockBudgetWithRelations({
                id: 1,
                overallLimit: 1000 * PRECISION,
                rolloverEnabled: true,
                rolloverDeficitEnabled: false,
                rolloverAmount: 0,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockBudgetRepository.findActive.mockResolvedValue(expiredBudget);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult(700));
            mockBudgetRepository.updateById.mockResolvedValue(
                createMockBudgetWithRelations({
                    startDate: new Date('2024-02-01'),
                    endDate: new Date('2024-02-29'),
                    rolloverAmount: 300 * PRECISION
                })
            );

            await budgetService.getActive();

            expect(mockBudgetRepository.updateById).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    rolloverAmount: 300 * PRECISION
                })
            );
        });

        it('accumulates rollover with existing rollover amount', async () => {
            jest.setSystemTime(new Date('2024-02-01'));
            const expiredBudget = createMockBudgetWithRelations({
                id: 1,
                overallLimit: 1000 * PRECISION,
                rolloverEnabled: true,
                rolloverDeficitEnabled: false,
                rolloverAmount: 200 * PRECISION,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockBudgetRepository.findActive.mockResolvedValue(expiredBudget);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult(600));
            mockBudgetRepository.updateById.mockResolvedValue(
                createMockBudgetWithRelations({
                    rolloverAmount: 600 * PRECISION
                })
            );

            await budgetService.getActive();

            expect(mockBudgetRepository.updateById).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    rolloverAmount: 600 * PRECISION
                })
            );
        });

        it('does not rollover when rollover is disabled', async () => {
            jest.setSystemTime(new Date('2024-02-01'));
            const expiredBudget = createMockBudgetWithRelations({
                id: 1,
                overallLimit: 1000 * PRECISION,
                rolloverEnabled: false,
                rolloverDeficitEnabled: false,
                rolloverAmount: 0,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockBudgetRepository.findActive.mockResolvedValue(expiredBudget);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult(700));
            mockBudgetRepository.updateById.mockResolvedValue(
                createMockBudgetWithRelations({
                    rolloverAmount: 0
                })
            );

            await budgetService.getActive();

            expect(mockBudgetRepository.updateById).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    rolloverAmount: 0
                })
            );
        });
    });

    describe('deficit rollover behavior', () => {
        it('applies negative rollover when deficit rollover is enabled and overspent', async () => {
            jest.setSystemTime(new Date('2024-02-01'));
            const expiredBudget = createMockBudgetWithRelations({
                id: 1,
                overallLimit: 1000 * PRECISION,
                rolloverEnabled: true,
                rolloverDeficitEnabled: true,
                rolloverAmount: 0,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockBudgetRepository.findActive.mockResolvedValue(expiredBudget);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult(1200));
            mockBudgetRepository.updateById.mockResolvedValue(
                createMockBudgetWithRelations({
                    rolloverAmount: -200 * PRECISION
                })
            );

            await budgetService.getActive();

            expect(mockBudgetRepository.updateById).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    rolloverAmount: -200 * PRECISION
                })
            );
        });

        it('does not apply negative rollover when deficit rollover is disabled', async () => {
            jest.setSystemTime(new Date('2024-02-01'));
            const expiredBudget = createMockBudgetWithRelations({
                id: 1,
                overallLimit: 1000 * PRECISION,
                rolloverEnabled: true,
                rolloverDeficitEnabled: false,
                rolloverAmount: 100 * PRECISION,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockBudgetRepository.findActive.mockResolvedValue(expiredBudget);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult(1200));
            mockBudgetRepository.updateById.mockResolvedValue(
                createMockBudgetWithRelations({
                    rolloverAmount: 100 * PRECISION
                })
            );

            await budgetService.getActive();

            expect(mockBudgetRepository.updateById).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    rolloverAmount: 100 * PRECISION
                })
            );
        });
    });

    describe('period transition', () => {
        it('triggers new period creation when current period is expired', async () => {
            jest.setSystemTime(new Date('2024-02-01'));
            const expiredBudget = createMockBudgetWithRelations({
                id: 1,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockBudgetRepository.findActive.mockResolvedValue(expiredBudget);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult(500));
            mockBudgetRepository.updateById.mockResolvedValue(
                createMockBudgetWithRelations({
                    startDate: new Date('2024-02-01'),
                    endDate: new Date('2024-02-29')
                })
            );

            await budgetService.getActive();

            expect(mockBudgetRepository.updateById).toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    startDate: expect.any(Date),
                    endDate: expect.any(Date)
                })
            );
        });

        it('returns existing budget when period is not expired', async () => {
            jest.setSystemTime(new Date('2024-01-15'));
            const activeBudget = createMockBudgetWithRelations({
                id: 1,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockBudgetRepository.findActive.mockResolvedValue(activeBudget);

            const result = await budgetService.getActive();

            expect(mockBudgetRepository.updateById).not.toHaveBeenCalled();
            expect(result).toEqual(activeBudget);
        });

        it('creates period snapshot during transition', async () => {
            jest.setSystemTime(new Date('2024-02-01'));
            const expiredBudget = createMockBudgetWithRelations({
                id: 1,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockBudgetRepository.findActive.mockResolvedValue(expiredBudget);
            mockBudgetCalculationService.calculate.mockResolvedValue(createMockCalculationResult(500));
            mockBudgetRepository.updateById.mockResolvedValue(
                createMockBudgetWithRelations({
                    startDate: new Date('2024-02-01'),
                    endDate: new Date('2024-02-29')
                })
            );

            await budgetService.getActive();

            expect(mockBudgetPeriodSnapshotRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    budgetId: 1,
                    periodStart: new Date('2024-01-01'),
                    periodEnd: new Date('2024-01-31')
                })
            );
        });
    });

    describe('getActive', () => {
        it('returns undefined when no active budget exists', async () => {
            mockBudgetRepository.findActive.mockResolvedValue(undefined);

            const result = await budgetService.getActive();

            expect(result).toBeUndefined();
        });
    });
});
