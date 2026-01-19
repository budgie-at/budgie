import {
    BudgetCategoryLimitEntityInterface,
    BudgetCreateInputInterface,
    BudgetEntityInterface,
    BudgetIncomeExpectationEntityInterface,
    BudgetPeriodEnum
} from '@budgie/contracts';
import { addDays, addMonths, addWeeks, startOfDay } from 'date-fns';

import { isDefined } from '@rnw-community/shared';

import { budgetCategoryLimitRepository, budgetIncomeExpectationRepository, budgetRepository, db } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { convertToMicroUnits } from '../../@generic/utils/convert-to-micro-units.util';

interface PeriodDatesInterface {
    readonly startDate: Date;
    readonly endDate: Date;
}

interface BudgetWithRelationsInterface extends BudgetEntityInterface {
    readonly categoryLimits: BudgetCategoryLimitEntityInterface[];
    readonly incomeExpectations: BudgetIncomeExpectationEntityInterface[];
}

class BudgetService {
    async getActive(): Promise<BudgetEntityInterface | undefined> {
        const budget = await budgetRepository.findActive();

        if (!isDefined(budget)) {
            return budget;
        }

        if (this.isPeriodExpired(budget)) {
            return this.rolloverToNewPeriod(budget);
        }

        return budget;
    }

    async create(input: BudgetCreateInputInterface): Promise<BudgetEntityInterface> {
        return db.transaction(async transaction => {
            const { startDate, endDate } = this.calculatePeriodDates(input.period, input.periodStartDay);

            const budget = await budgetRepository.create(
                {
                    name: input.name,
                    period: input.period,
                    periodStartDay: input.periodStartDay,
                    overallLimit: convertToMicroUnits(input.overallLimit),
                    startDate,
                    endDate
                },
                transaction
            );

            const categoryLimitsInMicroUnits = input.categoryLimits.map(categoryLimit => ({
                categoryId: categoryLimit.categoryId,
                limit: convertToMicroUnits(categoryLimit.limit)
            }));

            const incomeExpectationsInMicroUnits = input.incomeExpectations.map(incomeExpectation => ({
                categoryId: incomeExpectation.categoryId,
                expectedAmount: convertToMicroUnits(incomeExpectation.expectedAmount)
            }));

            await budgetCategoryLimitRepository.bulkCreate(budget.id, categoryLimitsInMicroUnits, transaction);
            await budgetIncomeExpectationRepository.bulkCreate(budget.id, incomeExpectationsInMicroUnits, transaction);

            const createdBudget = await budgetRepository.getById(budget.id, transaction);

            if (!isDefined(createdBudget)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings
                throw new Error('Failed to create budget');
            }

            return createdBudget;
        });
    }

    getBudgetUpdatePayload(budget: BudgetWithRelationsInterface): BudgetCreateInputInterface {
        return {
            name: budget.name,
            period: budget.period,
            periodStartDay: budget.periodStartDay,
            overallLimit: convertFromMicroUnits(budget.overallLimit),
            startDate: budget.startDate,
            endDate: budget.endDate,
            categoryLimits: budget.categoryLimits.map(categoryLimit => ({
                categoryId: categoryLimit.categoryId,
                limit: convertFromMicroUnits(categoryLimit.limit)
            })),
            incomeExpectations: budget.incomeExpectations.map(incomeExpectation => ({
                categoryId: incomeExpectation.categoryId,
                expectedAmount: convertFromMicroUnits(incomeExpectation.expectedAmount)
            }))
        };
    }

    async update(id: number, input: BudgetCreateInputInterface): Promise<BudgetEntityInterface> {
        return db.transaction(async transaction => {
            const { startDate, endDate } = this.calculatePeriodDates(input.period, input.periodStartDay);

            await budgetRepository.updateById(
                id,
                {
                    name: input.name,
                    period: input.period,
                    periodStartDay: input.periodStartDay,
                    overallLimit: convertToMicroUnits(input.overallLimit),
                    startDate,
                    endDate
                },
                transaction
            );

            await budgetCategoryLimitRepository.deleteByBudgetId(id, transaction);
            await budgetIncomeExpectationRepository.deleteByBudgetId(id, transaction);

            const categoryLimitsInMicroUnits = input.categoryLimits.map(categoryLimit => ({
                categoryId: categoryLimit.categoryId,
                limit: convertToMicroUnits(categoryLimit.limit)
            }));

            const incomeExpectationsInMicroUnits = input.incomeExpectations.map(incomeExpectation => ({
                categoryId: incomeExpectation.categoryId,
                expectedAmount: convertToMicroUnits(incomeExpectation.expectedAmount)
            }));

            await budgetCategoryLimitRepository.bulkCreate(id, categoryLimitsInMicroUnits, transaction);
            await budgetIncomeExpectationRepository.bulkCreate(id, incomeExpectationsInMicroUnits, transaction);

            const updatedBudget = await budgetRepository.getById(id, transaction);

            if (!isDefined(updatedBudget)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings
                throw new Error('Failed to update budget');
            }

            return updatedBudget;
        });
    }

    private isPeriodExpired(budget: BudgetEntityInterface): boolean {
        const currentDate = startOfDay(new Date());
        const endDate = startOfDay(budget.endDate);

        return currentDate > endDate;
    }

    private async rolloverToNewPeriod(budget: BudgetEntityInterface): Promise<BudgetEntityInterface> {
        const { startDate, endDate } = this.calculatePeriodDates(budget.period, budget.periodStartDay);

        return budgetRepository.updateById(budget.id, { startDate, endDate });
    }

    private calculatePeriodDates(period: BudgetPeriodEnum, startDay: number): PeriodDatesInterface {
        const today = new Date();
        const currentDay = today.getDate();
        const startDate = this.calculateStartDate(period, startDay, today, currentDay);
        const endDate = this.calculateEndDate(period, startDate);

        return { startDate, endDate };
    }

    private calculateStartDate(period: BudgetPeriodEnum, startDay: number, today: Date, currentDay: number): Date {
        if (period === BudgetPeriodEnum.WEEKLY) {
            return this.calculateWeeklyStartDate(today, startDay, 7);
        }

        if (period === BudgetPeriodEnum.BI_WEEKLY) {
            return this.calculateWeeklyStartDate(today, startDay, 14);
        }

        return this.calculateMonthlyStartDate(today, startDay, currentDay);
    }

    private calculateWeeklyStartDate(today: Date, startDay: number, cycleLength: number): Date {
        const currentDayOfWeek = today.getDay();
        const targetDayOfWeek = startDay % 7;
        const daysToSubtract = (currentDayOfWeek - targetDayOfWeek + cycleLength) % cycleLength;

        return startOfDay(addDays(today, -daysToSubtract));
    }

    private calculateMonthlyStartDate(today: Date, startDay: number, currentDay: number): Date {
        const adjustedStartDay = Math.min(startDay, this.getDaysInMonth(today));

        if (currentDay >= adjustedStartDay) {
            return startOfDay(new Date(today.getFullYear(), today.getMonth(), adjustedStartDay));
        }

        const previousMonth = addMonths(today, -1);
        const previousMonthAdjustedStartDay = Math.min(startDay, this.getDaysInMonth(previousMonth));

        return startOfDay(new Date(previousMonth.getFullYear(), previousMonth.getMonth(), previousMonthAdjustedStartDay));
    }

    private calculateEndDate(period: BudgetPeriodEnum, startDate: Date): Date {
        if (period === BudgetPeriodEnum.WEEKLY) {
            return startOfDay(addDays(startDate, 6));
        }

        if (period === BudgetPeriodEnum.BI_WEEKLY) {
            return startOfDay(addDays(addWeeks(startDate, 1), 6));
        }

        return startOfDay(addDays(addMonths(startDate, 1), -1));
    }

    private getDaysInMonth(date: Date): number {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }
}

export const budgetService = new BudgetService();
