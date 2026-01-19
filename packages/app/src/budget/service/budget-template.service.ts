import {
    BudgetCreateInputInterface,
    BudgetEntityInterface,
    BudgetTemplateCategoryLimitInterface,
    BudgetTemplateCreateEntityInterface,
    BudgetTemplateEntityInterface,
    BudgetTemplateIncomeExpectationInterface
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import {
    budgetCategoryLimitRepository,
    budgetIncomeExpectationRepository,
    budgetTemplateRepository,
    categoryRepository
} from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

interface ValidatedTemplateInterface {
    readonly template: BudgetTemplateEntityInterface;
    readonly missingCategoryIds: number[];
    readonly categoryLimits: BudgetTemplateCategoryLimitInterface[];
    readonly incomeExpectations: BudgetTemplateIncomeExpectationInterface[];
}

class BudgetTemplateService {
    async createFromBudget(budget: BudgetEntityInterface, name: string): Promise<BudgetTemplateEntityInterface> {
        const categoryLimits = await budgetCategoryLimitRepository.getByBudgetId(budget.id);
        const incomeExpectations = await budgetIncomeExpectationRepository.getByBudgetId(budget.id);

        const categoryLimitsJson = JSON.stringify(
            categoryLimits.map(limit => ({
                categoryId: limit.categoryId,
                limit: limit.limit
            }))
        );

        const incomeExpectationsJson = JSON.stringify(
            incomeExpectations.map(expectation => ({
                categoryId: expectation.categoryId,
                expectedAmount: expectation.expectedAmount
            }))
        );

        const input: BudgetTemplateCreateEntityInterface = {
            name,
            period: budget.period,
            periodStartDay: budget.periodStartDay,
            overallLimit: budget.overallLimit,
            rolloverEnabled: budget.rolloverEnabled,
            rolloverDeficitEnabled: budget.rolloverDeficitEnabled,
            categoryLimitsJson,
            incomeExpectationsJson
        };

        return budgetTemplateRepository.create(input);
    }

    async validateTemplate(template: BudgetTemplateEntityInterface): Promise<ValidatedTemplateInterface> {
        const categoryLimits = this.parseCategoryLimitsJson(template.categoryLimitsJson);
        const incomeExpectations = this.parseIncomeExpectationsJson(template.incomeExpectationsJson);

        const allCategoryIds = [
            ...categoryLimits.map(limit => limit.categoryId),
            ...incomeExpectations.map(expectation => expectation.categoryId)
        ];

        const uniqueCategoryIds = [...new Set(allCategoryIds)];
        const categories = await categoryRepository.findAll();
        const existingCategoryIds = new Set(categories.map(category => category.id));

        const missingCategoryIds = uniqueCategoryIds.filter(categoryId => !existingCategoryIds.has(categoryId));

        return {
            template,
            missingCategoryIds,
            categoryLimits,
            incomeExpectations
        };
    }

    applyTemplateToFormData(
        validatedTemplate: ValidatedTemplateInterface,
        skipMissingCategories: boolean
    ): Omit<BudgetCreateInputInterface, 'name' | 'startDate' | 'endDate'> {
        const { template, missingCategoryIds, categoryLimits, incomeExpectations } = validatedTemplate;

        const filteredCategoryLimits = skipMissingCategories
            ? categoryLimits.filter(limit => !missingCategoryIds.includes(limit.categoryId))
            : categoryLimits;

        const filteredIncomeExpectations = skipMissingCategories
            ? incomeExpectations.filter(expectation => !missingCategoryIds.includes(expectation.categoryId))
            : incomeExpectations;

        return {
            period: template.period,
            periodStartDay: template.periodStartDay,
            overallLimit: convertFromMicroUnits(template.overallLimit),
            rolloverEnabled: template.rolloverEnabled,
            rolloverDeficitEnabled: template.rolloverDeficitEnabled,
            categoryLimits: filteredCategoryLimits.map(limit => ({
                categoryId: limit.categoryId,
                limit: convertFromMicroUnits(limit.limit)
            })),
            incomeExpectations: filteredIncomeExpectations.map(expectation => ({
                categoryId: expectation.categoryId,
                expectedAmount: convertFromMicroUnits(expectation.expectedAmount)
            }))
        };
    }

    async isNameTaken(name: string): Promise<boolean> {
        const existing = await budgetTemplateRepository.findByName(name);

        return isDefined(existing);
    }

    private parseCategoryLimitsJson(json: string | null): BudgetTemplateCategoryLimitInterface[] {
        if (!isDefined(json)) {
            return [];
        }

        const parsed: unknown = JSON.parse(json);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.map((item: { categoryId: number; limit: number }) => ({
            categoryId: item.categoryId,
            limit: item.limit
        }));
    }

    private parseIncomeExpectationsJson(json: string | null): BudgetTemplateIncomeExpectationInterface[] {
        if (!isDefined(json)) {
            return [];
        }

        const parsed: unknown = JSON.parse(json);

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.map((item: { categoryId: number; expectedAmount: number }) => ({
            categoryId: item.categoryId,
            expectedAmount: item.expectedAmount
        }));
    }
}

export const budgetTemplateService = new BudgetTemplateService();
