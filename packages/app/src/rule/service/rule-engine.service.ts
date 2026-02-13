import {
    RuleActionEntityInterface,
    RuleActionTypeEnum,
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
import { convertTransactionToTransfer } from '../util/convert-transaction-to-transfer.util';
import { evaluateRuleCondition } from '../util/evaluate-rule-condition.util';

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 50;

const calculateAmountForRuleEvaluation = (transaction: TransactionWithEntriesMccCategoryEntityInterface): number => {
    const entries = transaction[TransactionAssociationEnum.ENTRIES];

    if (transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.TRANSFER) {
        return entries.reduce((acc, curr) => (curr.type === TransactionEntryTypeEnum.CREDIT ? acc + curr.amount : acc), 0);
    }

    if (transaction.type === TransactionTypeEnum.INCOME) {
        return entries.reduce((acc, curr) => (curr.type === TransactionEntryTypeEnum.DEBIT ? acc + curr.amount : acc), 0);
    }

    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        const hasDebit = entries.some(entry => entry.type === TransactionEntryTypeEnum.DEBIT);

        return hasDebit
            ? entries.reduce((acc, curr) => (curr.type === TransactionEntryTypeEnum.DEBIT ? acc + curr.amount : acc), 0)
            : entries.reduce((acc, curr) => (curr.type === TransactionEntryTypeEnum.CREDIT ? acc + curr.amount : acc), 0);
    }

    return 0;
};

const convertTransactionForRuleEvaluation = (
    transaction: TransactionWithEntriesMccCategoryEntityInterface
): TransactionCreateInputInterface => {
    const entries = transaction[TransactionAssociationEnum.ENTRIES];

    return {
        ...transaction,
        amount: convertFromMicroUnits(calculateAmountForRuleEvaluation(transaction)),
        tagIds: [],
        entries: entries.map(entry => ({
            type: entry.type,
            categoryId: entry.categoryId,
            accountId: entry.accountId,
            amount: convertFromMicroUnits(entry.amount),
            mccCategoryId: entry[TransactionEntryAssociationEnum.MCC_CATEGORY]?.id ?? null
        }))
    };
};

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

    async applyRuleToMatchingTransactions(ruleId: number): Promise<void> {
        const rule = await ruleRepository.findByIdWithRelations(ruleId);

        if (!isDefined(rule) || !isNotEmptyArray(rule.conditions)) {
            return;
        }

        await this.processTransactionBatch(rule, 0);
    }

    private async processTransactionBatch(rule: RuleWithRelationsEntityInterface, offset: number): Promise<void> {
        await new Promise<void>(resolve => {
            setTimeout(resolve, BATCH_DELAY_MS);
        });

        const transactions = await transactionRepository.getAllWithOffset(BATCH_SIZE, offset);

        if (!isNotEmptyArray(transactions)) {
            return;
        }

        await this.applyRuleToTransactionBatch(rule, transactions);

        if (transactions.length >= BATCH_SIZE) {
            await this.processTransactionBatch(rule, offset + BATCH_SIZE);
        }
    }

    private async applyRuleToTransactionBatch(
        rule: RuleWithRelationsEntityInterface,
        transactions: TransactionWithEntriesMccCategoryEntityInterface[]
    ): Promise<void> {
        const matchingTransactions = transactions.filter(transaction => {
            const input = convertTransactionForRuleEvaluation(transaction);

            return this.evaluateRule(rule, input);
        });

        await Promise.all(matchingTransactions.map(transaction => this.applyRuleActionsToTransaction(transaction.id, rule.actions)));
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

    private async applyRuleActions(transactionId: number, actions: RuleActionEntityInterface[], transaction: Transaction): Promise<void> {
        const sortedActions = [...actions].sort((actionA, actionB) => {
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
