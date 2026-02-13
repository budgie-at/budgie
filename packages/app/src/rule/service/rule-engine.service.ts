import {
    RuleActionEntityInterface,
    RuleActionTypeEnum,
    RuleConditionCreateInputInterface,
    RuleConditionMatchTypeEnum,
    RuleWithRelationsEntityInterface,
    TransactionAssociationEnum,
    TransactionCreateInputInterface,
    TransactionEntryAssociationEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionWithEntriesMccCategoryEntityInterface
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import {
    db,
    ruleRepository,
    transactionEntryRepository,
    transactionRepository,
    transactionTagsRepository
} from '../../@generic/drizzle/db/db';
import { Transaction } from '../../@generic/type/transaction.type';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { sumEntryAmounts } from '../../transaction/utils/sum-entry-amounts.util';
import { convertTransactionToTransfer } from '../util/convert-transaction-to-transfer.util';
import { evaluateRuleCondition } from '../util/evaluate-rule-condition.util';

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 50;

interface CountConditionsParams {
    readonly conditions: RuleConditionCreateInputInterface[];
    readonly conditionMatchType: RuleConditionMatchTypeEnum;
}

class RuleEngineService {
    async applyRulesToTransactions(transactionIds: number[], transactionInputs: TransactionCreateInputInterface[]): Promise<void> {
        const rules = await ruleRepository.findEnabledWithRelations();
        if (!isNotEmptyArray(rules)) {
            return;
        }

        await Promise.all(
            transactionIds.map((transactionId, index) => this.applyRulesToTransaction(transactionId, transactionInputs[index], rules))
        );
    }

    // eslint-disable-next-line max-statements -- Batch processing with loop control variables
    async countMatchingTransactions(params: CountConditionsParams): Promise<number> {
        const { conditions, conditionMatchType } = params;

        if (!isNotEmptyArray(conditions)) {
            return 0;
        }

        let count = 0;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            // eslint-disable-next-line no-await-in-loop
            const transactions = await transactionRepository.getAllWithOffset(BATCH_SIZE, offset);

            if (!isNotEmptyArray(transactions)) {
                break;
            }

            const matchCount = transactions.filter(transaction => {
                const input = this.convertTransactionForRuleEvaluation(transaction);

                return this.evaluateConditions(conditions, conditionMatchType, input);
            }).length;

            count += matchCount;
            hasMore = transactions.length >= BATCH_SIZE;
            offset += BATCH_SIZE;
        }

        return count;
    }

    // eslint-disable-next-line max-statements -- Two-phase batch processing with progress tracking
    async applyRuleToMatchingTransactions(ruleId: number, onProgress?: (processed: number, total: number) => void): Promise<void> {
        const rule = await ruleRepository.findByIdWithRelations(ruleId);

        if (!isDefined(rule) || !isNotEmptyArray(rule.conditions)) {
            return;
        }

        const matchingIds = await this.collectMatchingTransactionIds(rule);

        if (!isNotEmptyArray(matchingIds)) {
            return;
        }

        const total = matchingIds.length;
        let processed = 0;

        for (let batchStart = 0; batchStart < total; batchStart += BATCH_SIZE) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>(resolve => {
                setTimeout(resolve, BATCH_DELAY_MS);
            });

            const batchIds = matchingIds.slice(batchStart, batchStart + BATCH_SIZE);
            // eslint-disable-next-line no-await-in-loop
            await Promise.all(batchIds.map(transactionId => this.applyRuleActionsToTransaction(transactionId, rule.actions)));

            processed += batchIds.length;
            onProgress?.(processed, total);
        }
    }

    private async collectMatchingTransactionIds(rule: RuleWithRelationsEntityInterface): Promise<number[]> {
        const matchingIds: number[] = [];
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>(resolve => {
                setTimeout(resolve, BATCH_DELAY_MS);
            });

            // eslint-disable-next-line no-await-in-loop
            const transactions = await transactionRepository.getAllWithOffset(BATCH_SIZE, offset);

            if (!isNotEmptyArray(transactions)) {
                break;
            }

            transactions.forEach(transaction => {
                const input = this.convertTransactionForRuleEvaluation(transaction);
                if (this.evaluateRule(rule, input)) {
                    matchingIds.push(transaction.id);
                }
            });

            hasMore = transactions.length >= BATCH_SIZE;
            offset += BATCH_SIZE;
        }

        return matchingIds;
    }

    private evaluateConditions(
        conditions: RuleConditionCreateInputInterface[],
        conditionMatchType: RuleConditionMatchTypeEnum,
        input: TransactionCreateInputInterface
    ): boolean {
        const evaluator = conditionMatchType === RuleConditionMatchTypeEnum.ANY ? 'some' : 'every';

        return conditions[evaluator](condition =>
            evaluateRuleCondition({ ...condition, id: 0, ruleId: 0, createdAt: new Date(), updatedAt: new Date(), deletedAt: null }, input)
        );
    }

    private async applyRulesToTransaction(
        transactionId: number,
        input: TransactionCreateInputInterface,
        rules: RuleWithRelationsEntityInterface[]
    ): Promise<void> {
        const matchingRules = rules.filter(rule => this.evaluateRule(rule, input));

        if (!isNotEmptyArray(matchingRules)) {
            return;
        }

        await db.transaction(async transaction => {
            for (const rule of matchingRules) {
                // eslint-disable-next-line no-await-in-loop
                await this.applyRuleActions(transactionId, rule.actions, transaction);
            }
        });
    }

    private evaluateRule(rule: RuleWithRelationsEntityInterface, input: TransactionCreateInputInterface): boolean {
        if (!isNotEmptyArray(rule.conditions)) {
            return false;
        }

        const evaluator = rule.conditionMatchType === RuleConditionMatchTypeEnum.ANY ? 'some' : 'every';

        return rule.conditions[evaluator](condition => evaluateRuleCondition(condition, input));
    }

    private async applyRuleActionsToTransaction(transactionId: number, actions: RuleActionEntityInterface[]): Promise<void> {
        await db.transaction(async transaction => {
            await this.applyRuleActions(transactionId, actions, transaction);
        });
    }

    private calculateAmountForRuleEvaluation(transaction: TransactionWithEntriesMccCategoryEntityInterface): number {
        const entries = transaction[TransactionAssociationEnum.ENTRIES];

        if (transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.TRANSFER) {
            return sumEntryAmounts(entries, TransactionEntryTypeEnum.CREDIT);
        }

        if (transaction.type === TransactionTypeEnum.INCOME) {
            return sumEntryAmounts(entries, TransactionEntryTypeEnum.DEBIT);
        }

        if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
            const hasDebit = entries.some(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

            return hasDebit
                ? sumEntryAmounts(entries, TransactionEntryTypeEnum.DEBIT)
                : sumEntryAmounts(entries, TransactionEntryTypeEnum.CREDIT);
        }

        return 0;
    }

    private convertTransactionForRuleEvaluation(
        transaction: TransactionWithEntriesMccCategoryEntityInterface
    ): TransactionCreateInputInterface {
        const entries = transaction[TransactionAssociationEnum.ENTRIES];

        return {
            ...transaction,
            amount: convertFromMicroUnits(this.calculateAmountForRuleEvaluation(transaction)),
            tagIds: [],
            entries: entries.map(entry => ({
                type: entry.type,
                categoryId: entry.categoryId,
                accountId: entry.accountId,
                amount: convertFromMicroUnits(entry.amount),
                mccCategoryId: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.id ?? null
            }))
        };
    }

    private async applyRuleActions(transactionId: number, actions: RuleActionEntityInterface[], transaction: Transaction): Promise<void> {
        const sortedActions = actions.toSorted((actionA, actionB) => {
            if (actionA.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER) {
                return 1;
            }

            if (actionB.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER) {
                return -1;
            }

            return 0;
        });

        for (const action of sortedActions) {
            switch (action.type) {
                case RuleActionTypeEnum.SET_CATEGORY:
                    if (isDefined(action.categoryId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await transactionEntryRepository.updateCategoryByTransactionId(transactionId, action.categoryId, transaction);
                        // eslint-disable-next-line no-await-in-loop
                        await transactionRepository.touchUpdatedAt(transactionId, transaction);
                    }
                    break;

                case RuleActionTypeEnum.ADD_TAG:
                    if (isDefined(action.tagId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await transactionTagsRepository.bulkCreate([{ transactionId, tagId: action.tagId }], transaction);
                        // eslint-disable-next-line no-await-in-loop
                        await transactionRepository.touchUpdatedAt(transactionId, transaction);
                    }
                    break;

                case RuleActionTypeEnum.CONVERT_TO_TRANSFER:
                    if (isDefined(action.accountId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await convertTransactionToTransfer({ transactionId, targetAccountId: action.accountId, tx: transaction });
                    }
                    break;

                default:
                    break;
            }
        }
    }
}

export const ruleEngineService = new RuleEngineService();
