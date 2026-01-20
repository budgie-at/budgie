/* eslint-disable import/order */
import { BudgetEntityInterface, BudgetPeriodEnum, PRECISION, TransactionTypeEnum } from '@budgie/contracts';

import { BudgetStatusEnum } from '../../enum/budget-status.enum';

const mockTransactionRepository = {
    getAll: jest.fn()
};

const mockAccountBudgetExclusionRepository = {
    getExcludedAccountIds: jest.fn()
};

const mockCategoryRepository = {
    findByIds: jest.fn()
};

jest.mock('../../../@generic/drizzle/db/db', () => ({
    get transactionRepository() {
        return mockTransactionRepository;
    },
    get accountBudgetExclusionRepository() {
        return mockAccountBudgetExclusionRepository;
    },
    get categoryRepository() {
        return mockCategoryRepository;
    }
}));

import { budgetCalculationService } from '../budget-calculation.service';

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

const createMockBudgetWithRelations = (
    overrides: Partial<BudgetEntityInterface> = {},
    categoryLimits: Array<{ categoryId: number; limit: number; category: { id: number; title: string } }> = [],
    incomeExpectations: Array<{ categoryId: number; expectedAmount: number; category: { id: number; title: string } }> = []
) => ({
    ...createMockBudget(overrides),
    categoryLimits: categoryLimits.map(limit => ({
        id: limit.categoryId,
        budgetId: 1,
        categoryId: limit.categoryId,
        limit: limit.limit,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        category: {
            id: limit.category.id,
            title: limit.category.title,
            isIncome: false,
            icon: 'shopping',
            parentId: null,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
        }
    })),
    incomeExpectations: incomeExpectations.map(expectation => ({
        id: expectation.categoryId,
        budgetId: 1,
        categoryId: expectation.categoryId,
        expectedAmount: expectation.expectedAmount,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        category: {
            id: expectation.category.id,
            title: expectation.category.title,
            isIncome: true,
            icon: 'salary',
            parentId: null,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01')
        }
    }))
});

const createMockTransaction = (
    type: TransactionTypeEnum,
    entries: Array<{ categoryId: number; amount: number }>,
    overrides: {
        id?: number;
        fromAccountId?: number | null;
        toAccountId?: number | null;
    } = {}
) => ({
    id: overrides.id ?? 1,
    type,
    date: new Date('2024-01-15'),
    fromAccountId: overrides.fromAccountId ?? 1,
    toAccountId: overrides.toAccountId ?? null,
    comment: null,
    entries: entries.map((entry, index) => ({
        id: index + 1,
        transactionId: overrides.id ?? 1,
        categoryId: entry.categoryId,
        amount: entry.amount,
        amountInMainCurrency: entry.amount,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
    })),
    tags: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
});

describe('BudgetCalculationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-15'));
        mockAccountBudgetExclusionRepository.getExcludedAccountIds.mockResolvedValue([]);
        mockCategoryRepository.findByIds.mockResolvedValue([]);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('spent percentage calculation', () => {
        it('calculates spent percentage correctly as spent divided by limit times 100', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 400 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.overallPercentage).toBe(40);
        });

        it('returns 0 percentage when effective limit is 0', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 0, rolloverAmount: 0 });
            mockTransactionRepository.getAll.mockResolvedValue([]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.overallPercentage).toBe(0);
        });
    });

    describe('status transitions', () => {
        it('returns ON_TRACK status when percentage is below 80', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 790 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.overallStatus).toBe(BudgetStatusEnum.ON_TRACK);
        });

        it('returns WARNING status when percentage is at 80', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 800 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.overallStatus).toBe(BudgetStatusEnum.WARNING);
        });

        it('returns WARNING status when percentage is 99', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 990 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.overallStatus).toBe(BudgetStatusEnum.WARNING);
        });

        it('returns OVER status when percentage is at 100', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 1000 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.overallStatus).toBe(BudgetStatusEnum.OVER);
        });

        it('returns OVER status when percentage exceeds 100', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 1500 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.overallStatus).toBe(BudgetStatusEnum.OVER);
        });
    });

    describe('pace calculation', () => {
        it('calculates days elapsed correctly', async () => {
            const budget = createMockBudgetWithRelations({
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockTransactionRepository.getAll.mockResolvedValue([]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.daysElapsed).toBe(15);
        });

        it('calculates expected spent by current day correctly', async () => {
            const budget = createMockBudgetWithRelations({
                overallLimit: 3100 * PRECISION,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockTransactionRepository.getAll.mockResolvedValue([]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.dailyBudget).toBe(100);
            expect(result.expectedSpentByNow).toBe(1500);
        });

        it('marks as on pace when spent is less than expected', async () => {
            const budget = createMockBudgetWithRelations({
                overallLimit: 3100 * PRECISION,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 1000 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.isOnPace).toBe(true);
        });

        it('marks as not on pace when spent exceeds expected', async () => {
            const budget = createMockBudgetWithRelations({
                overallLimit: 3100 * PRECISION,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 2000 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.isOnPace).toBe(false);
        });

        it('calculates pace variance correctly', async () => {
            const budget = createMockBudgetWithRelations({
                overallLimit: 3100 * PRECISION,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 1200 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.paceVariance).toBe(300);
        });
    });

    describe('empty budget handling', () => {
        it('returns correct structure for budget with no limits', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockTransactionRepository.getAll.mockResolvedValue([]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.categoryStatuses).toEqual([]);
            expect(result.incomeStatuses).toEqual([]);
            expect(result.allocatedAmount).toBe(0);
            expect(result.unallocatedBuffer).toBe(1000);
        });

        it('returns 0 spent when no transactions exist', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockTransactionRepository.getAll.mockResolvedValue([]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.totalSpent).toBe(0);
            expect(result.overallRemaining).toBe(1000);
        });
    });

    describe('account exclusions', () => {
        it('filters out transactions from excluded accounts', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockAccountBudgetExclusionRepository.getExcludedAccountIds.mockResolvedValue([2]);
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 100 * PRECISION }], {
                    id: 1,
                    fromAccountId: 1
                }),
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 200 * PRECISION }], {
                    id: 2,
                    fromAccountId: 2
                })
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.totalSpent).toBe(100);
        });

        it('includes all transactions when no accounts are excluded', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockAccountBudgetExclusionRepository.getExcludedAccountIds.mockResolvedValue([]);
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 100 * PRECISION }], {
                    id: 1,
                    fromAccountId: 1
                }),
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 200 * PRECISION }], {
                    id: 2,
                    fromAccountId: 2
                })
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.totalSpent).toBe(300);
        });
    });

    describe('unbudgeted spending', () => {
        it('aggregates spending for categories without limits', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION }, [
                { categoryId: 1, limit: 500 * PRECISION, category: { id: 1, title: 'Groceries' } }
            ]);
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 2, amount: 150 * PRECISION }])
            ]);
            mockCategoryRepository.findByIds.mockResolvedValue([
                {
                    id: 2,
                    title: 'Entertainment',
                    isIncome: false,
                    icon: 'movie',
                    parentId: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.unbudgetedSpending).toHaveLength(1);
            expect(result.unbudgetedSpending[0].spent).toBe(150);
            expect(result.totalUnbudgetedSpent).toBe(150);
        });

        it('returns empty unbudgeted spending when all categories have limits', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION }, [
                { categoryId: 1, limit: 500 * PRECISION, category: { id: 1, title: 'Groceries' } }
            ]);
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 150 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.unbudgetedSpending).toEqual([]);
            expect(result.totalUnbudgetedSpent).toBe(0);
        });
    });

    describe('income calculations', () => {
        it('calculates actual income vs expected correctly', async () => {
            const budget = createMockBudgetWithRelations(
                { overallLimit: 1000 * PRECISION },
                [],
                [{ categoryId: 10, expectedAmount: 5000 * PRECISION, category: { id: 10, title: 'Salary' } }]
            );
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.INCOME, [{ categoryId: 10, amount: 4500 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.totalExpectedIncome).toBe(5000);
            expect(result.totalActualIncome).toBe(4500);
            expect(result.incomeVariance).toBe(-500);
        });

        it('calculates positive income variance when actual exceeds expected', async () => {
            const budget = createMockBudgetWithRelations(
                { overallLimit: 1000 * PRECISION },
                [],
                [{ categoryId: 10, expectedAmount: 4000 * PRECISION, category: { id: 10, title: 'Salary' } }]
            );
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.INCOME, [{ categoryId: 10, amount: 5000 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.incomeVariance).toBe(1000);
        });
    });

    describe('micro-unit conversion accuracy', () => {
        it('converts overall limit from micro units correctly', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1234567890 });
            mockTransactionRepository.getAll.mockResolvedValue([]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.overallLimit).toBeCloseTo(1234.56789, 5);
        });

        it('converts spent amount from micro units correctly', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION });
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 123456789 }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.totalSpent).toBeCloseTo(123.456789, 5);
        });

        it('converts rollover amount from micro units correctly', async () => {
            const budget = createMockBudgetWithRelations({
                overallLimit: 1000 * PRECISION,
                rolloverAmount: 500 * PRECISION
            });
            mockTransactionRepository.getAll.mockResolvedValue([]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.rolloverAmount).toBe(500);
            expect(result.effectiveLimit).toBe(1500);
        });
    });

    describe('category status calculation', () => {
        it('calculates category spent correctly', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION }, [
                { categoryId: 1, limit: 300 * PRECISION, category: { id: 1, title: 'Groceries' } }
            ]);
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [{ categoryId: 1, amount: 150 * PRECISION }])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.categoryStatuses[0].spent).toBe(150);
            expect(result.categoryStatuses[0].remaining).toBe(150);
            expect(result.categoryStatuses[0].percentage).toBe(50);
            expect(result.categoryStatuses[0].status).toBe(BudgetStatusEnum.ON_TRACK);
        });

        it('counts warning statuses correctly', async () => {
            const budget = createMockBudgetWithRelations({ overallLimit: 1000 * PRECISION }, [
                { categoryId: 1, limit: 100 * PRECISION, category: { id: 1, title: 'Groceries' } },
                { categoryId: 2, limit: 100 * PRECISION, category: { id: 2, title: 'Entertainment' } }
            ]);
            mockTransactionRepository.getAll.mockResolvedValue([
                createMockTransaction(TransactionTypeEnum.EXPENSE, [
                    { categoryId: 1, amount: 85 * PRECISION },
                    { categoryId: 2, amount: 50 * PRECISION }
                ])
            ]);

            const result = await budgetCalculationService.calculate(budget);

            expect(result.warningCount).toBe(1);
        });
    });
});
