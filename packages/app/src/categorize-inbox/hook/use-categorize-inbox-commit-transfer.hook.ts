import { Db, RuleActionTypeEnum, RuleConditionFieldEnum, RuleConditionMatchTypeEnum, RuleConditionOperatorEnum } from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import { RuleRepository, RuleService } from '@budgie/rules';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';

import { isNotEmptyArray } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';

import type { CategorizeInboxPendingTransferInterface } from '../interface/categorize-inbox-pending-transfer.interface';
import type { CategorizeInboxVisibilityInterface } from '../interface/categorize-inbox-visibility.interface';
import type { CategorizeInboxEnqueueWriteType } from '../type/categorize-inbox-enqueue-write.type';

export const useCategorizeInboxCommitTransfer = (
    visibility: Pick<CategorizeInboxVisibilityInterface, 'showTransactions'>,
    enqueueWrite: CategorizeInboxEnqueueWriteType
) => {
    const { t } = useLingui();
    const [hapticNotification] = useVibration();

    return ({ transactionIds, accountId, isRuleEnabled, ruleConditionValue }: CategorizeInboxPendingTransferInterface): void => {
        enqueueWrite(
            Db.transaction(
                Effect.gen(function* () {
                    const transactionTransferService = yield* TransactionTransferService;
                    const convertedIds = yield* transactionTransferService.convertManyToTransferAccount(transactionIds, accountId);

                    if (isRuleEnabled && isNotEmptyArray(convertedIds)) {
                        const ruleRepository = yield* RuleRepository;
                        const existingRules = yield* ruleRepository.findEnabledWithRelations();
                        const normalizedValue = ruleConditionValue.toLowerCase();
                        const hasDuplicateRule = existingRules.some(
                            rule =>
                                rule.conditions.length === 1 &&
                                rule.conditions.every(
                                    condition =>
                                        condition.field === RuleConditionFieldEnum.TITLE &&
                                        condition.operator === RuleConditionOperatorEnum.EQUALS &&
                                        condition.value.toLowerCase() === normalizedValue
                                ) &&
                                rule.actions.some(
                                    action => action.type === RuleActionTypeEnum.CONVERT_TO_TRANSFER && action.accountId === accountId
                                )
                        );

                        if (!hasDuplicateRule) {
                            const ruleService = yield* RuleService;

                            yield* ruleService.create({
                                enabled: true,
                                conditionMatchType: RuleConditionMatchTypeEnum.ALL,
                                conditions: [
                                    {
                                        field: RuleConditionFieldEnum.TITLE,
                                        operator: RuleConditionOperatorEnum.EQUALS,
                                        value: ruleConditionValue,
                                        secondaryValue: null
                                    }
                                ],
                                actions: [{ type: RuleActionTypeEnum.CONVERT_TO_TRANSFER, categoryId: null, tagId: null, accountId }]
                            });
                        }
                    }

                    visibility.showTransactions(transactionIds.filter(transactionId => !convertedIds.includes(transactionId)));

                    if (isNotEmptyArray(convertedIds)) {
                        hapticNotification(NotificationFeedbackType.Success);
                    }
                })
            ),
            () => void visibility.showTransactions(transactionIds),
            t`Could not convert to transfers`
        );
    };
};
