import {
    AccountTypeEnum,
    RuleConditionCreateInputInterface,
    RuleConditionFieldEnum,
    RuleConditionOperatorEnum,
    RuleCreateInputInterface,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AnchoredMorphTrigger } from '../../../@generic/component/anchored-morph-trigger/anchored-morph-trigger';
import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { isEnumValue } from '../../../@generic/type-guard/is-enum-value.type-guard';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { RuleValueGlyph } from '../rule-value-glyph/rule-value-glyph';
import { RuleValuePickerButton } from '../rule-value-picker-button/rule-value-picker-button';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

const hasTransactionTypeCondition = (conditions: RuleConditionCreateInputInterface[], transactionType: TransactionTypeEnum): boolean =>
    conditions.some(
        condition =>
            condition.field === RuleConditionFieldEnum.TRANSACTION_TYPE &&
            condition.operator === RuleConditionOperatorEnum.EQUALS &&
            isEnumValue(condition.value, TransactionTypeEnum) &&
            condition.value === transactionType
    );

const resolveTransferCopy = (hasExpenseCondition: boolean, hasIncomeCondition: boolean) => {
    if (hasExpenseCondition && !hasIncomeCondition) {
        return { label: msg`Choose the account it goes to`, hint: msg`Matched expenses are converted into a transfer to this account.` };
    }

    if (hasIncomeCondition && !hasExpenseCondition) {
        return { label: msg`Choose the account it comes from`, hint: msg`Matched income is converted into a transfer from this account.` };
    }

    return {
        label: msg`Choose the other account`,
        hint: msg`Only expense and income transactions are converted: expenses transfer to this account, income transfers from it. Other types are left unchanged.`
    };
};

export const RuleActionAccountSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control, formState } = useFormContext<RuleCreateInputInterface>();
    const [openAccountSelector] = useAccountSelectorModal();
    const {
        field: { value: accountId, onChange }
    } = useController({ control, name: `actions.${index}.accountId` });
    const conditions = useWatch({ control, name: 'conditions' });
    const { account } = useGetAccountByIdQuery(accountId ?? 0);

    const hasExpenseCondition = hasTransactionTypeCondition(conditions, TransactionTypeEnum.EXPENSE);
    const hasIncomeCondition = hasTransactionTypeCondition(conditions, TransactionTypeEnum.INCOME);
    const { label, hint } = resolveTransferCopy(hasExpenseCondition, hasIncomeCondition);

    const isMissing = !isDefined(accountId) && (formState.isDirty || formState.submitCount > 0);

    const handleSelect = (origin: AnchoredMorphOriginInterface) => {
        openAccountSelector(
            { initialAccountId: accountId ?? null, excludeAccountTypes: [AccountTypeEnum.DEBT], onlyActive: false, origin },
            selectedAccountId => {
                if (isDefined(selectedAccountId)) {
                    onChange(selectedAccountId);
                }
            }
        );
    };

    const accountTitle = account?.title ?? null;

    return (
        <View className="flex-1 pb-md">
            <AnchoredMorphTrigger
                edge={RoundedEdgeEnum.ALL}
                radiusClassName="rounded-xl"
                colorClassName="bg-surface-fill"
                onPress={handleSelect}
            >
                {handlePress => (
                    <RuleValuePickerButton
                        value={accountTitle}
                        isMissing={isMissing}
                        leading={<RuleValueGlyph icon={UserIconNameEnum.Wallet} variant="cyan" />}
                        placeholder={t(label)}
                        name={t`Transfer account`}
                        testID={testID}
                        onPress={handlePress}
                    />
                )}
            </AnchoredMorphTrigger>
            <Text className="text-[13px] leading-[18px] text-secondary-foreground">{t(hint)}</Text>
        </View>
    );
};
