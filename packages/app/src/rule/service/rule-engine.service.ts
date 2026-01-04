import {
    MccCategoryEntityInterface,
    RuleActionEntityInterface,
    RuleActionTypeEnum,
    RuleConditionMatchTypeEnum,
    RuleWithRelationsEntityInterface,
    TransactionAssociationEnum,
    TransactionCreateInputInterface,
    TransactionEntityInterface,
    TransactionEntryAssociationEnum,
    TransactionEntryEntityInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { db, ruleRepository, transactionEntryRepository, transactionRepository, transactionTagsRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { evaluateRuleCondition } from '../util/evaluate-rule-condition.util';

const BATCH_SIZE = 100;

type TransactionWithEntries = TransactionEntityInterface & {
    readonly [TransactionAssociationEnum.ENTRIES]: Array<
        TransactionEntryEntityInterface & {
            readonly [TransactionEntryAssociationEnum.MCC_CATEGORY]: MccCategoryEntityInterface | null;
        }
    >;
};

const calculateAmountForRuleEvaluation = (transaction: TransactionWithEntries): number => {
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

const convertTransactionForRuleEvaluation = (transaction: TransactionWithEntries): TransactionCreateInputInterface => {
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
    async applyRulesToTransactions(
        transactionIds: number[],
        transactionInputs: TransactionCreateInputInterface[]
    ): Promise<void> {
        const rules = await ruleRepository.findEnabledWithRelations();
        if (!isNotEmptyArray(rules)) {
            return;
        }

        for (let i = 0; i < transactionIds.length; i += 1) {
            const transactionId = transactionIds[i];
            const input = transactionInputs[i];

            // eslint-disable-next-line no-await-in-loop
            await this.applyRulesToTransaction(transactionId, input, rules);
        }
    }

    async applyRuleToMatchingTransactions(ruleId: number): Promise<void> {
        const rule = await ruleRepository.findByIdWithRelations(ruleId);
        if (!isDefined(rule) || !isNotEmptyArray(rule.conditions)) {
            return;
        }

        await this.processMatchingTransactions(rule);
    }

    private async processMatchingTransactions(rule: RuleWithRelationsEntityInterface): Promise<void> {
        let offset = 0;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
            // eslint-disable-next-line no-await-in-loop
            const transactions = await transactionRepository.getAllWithOffset(BATCH_SIZE, offset);

            if (!isNotEmptyArray(transactions)) {
                break;
            }

            // eslint-disable-next-line no-await-in-loop
            await this.applyRuleToTransactionBatch(rule, transactions);

            offset += BATCH_SIZE;

            if (transactions.length < BATCH_SIZE) {
                break;
            }
        }
    }

    private async applyRuleToTransactionBatch(
        rule: RuleWithRelationsEntityInterface,
        transactions: TransactionWithEntries[]
    ): Promise<void> {
        for (const transaction of transactions) {
            const input = convertTransactionForRuleEvaluation(transaction);

            if (this.evaluateRule(rule, input)) {
                // eslint-disable-next-line no-await-in-loop
                await this.applyRuleActionsToTransaction(transaction.id, rule.actions);
            }
        }
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

        await db.transaction(async tx => {
            for (const rule of matchingRules) {
                // eslint-disable-next-line no-await-in-loop
                await this.applyRuleActions(transactionId, rule.actions, tx);
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
        await db.transaction(async tx => {
            await this.applyRuleActions(transactionId, actions, tx);
        });
    }

    private async applyRuleActions(
        transactionId: number,
        actions: RuleActionEntityInterface[],
        tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
    ): Promise<void> {
        for (const action of actions) {
            switch (action.type) {
                case RuleActionTypeEnum.SET_CATEGORY:
                    if (isDefined(action.categoryId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await transactionEntryRepository.updateCategoryByTransactionId(transactionId, action.categoryId, tx);
                    }
                    break;

                case RuleActionTypeEnum.ADD_TAG:
                    if (isDefined(action.tagId)) {
                        // eslint-disable-next-line no-await-in-loop
                        await transactionTagsRepository.bulkCreate([{ transactionId, tagId: action.tagId }], tx);
                    }
                    break;

                default:
                    break;
            }
        }
    }
}

export const ruleEngineService = new RuleEngineService();
