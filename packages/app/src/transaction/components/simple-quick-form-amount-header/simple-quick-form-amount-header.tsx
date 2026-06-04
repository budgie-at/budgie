import { ReactNode } from 'react';
import { View } from 'react-native';

import { RulePillSlot } from '../rule-pill-slot/rule-pill-slot';
import { TransactionFeePill } from '../transaction-fee-pill/transaction-fee-pill';

import type { RulePillSlotPropsInterface } from '../../interface/rule-pill-slot-props.interface';

interface Props extends RulePillSlotPropsInterface {
    readonly amountTopContent?: ReactNode;
    readonly currencySymbol: string;
    readonly feeAmount: number;
    readonly onFeePress: () => void;
}

export const SimpleQuickFormAmountHeader = ({
    amountTopContent,
    currencySymbol,
    feeAmount,
    onFeePress,
    ruleDetectionMode,
    suggestRuleData,
    updateRuleData,
    matchingRulesCount,
    matchingRuleIds,
    onRuleCreated,
    onDismiss,
    onCreatingChange
}: Props) => (
    <View className="h-[76px] items-center justify-end gap-xs">
        <RulePillSlot
            ruleDetectionMode={ruleDetectionMode}
            suggestRuleData={suggestRuleData}
            updateRuleData={updateRuleData}
            matchingRulesCount={matchingRulesCount}
            matchingRuleIds={matchingRuleIds}
            onRuleCreated={onRuleCreated}
            onDismiss={onDismiss}
            onCreatingChange={onCreatingChange}
        />
        <View className="flex-row flex-wrap items-center justify-center gap-xs">
            {amountTopContent}
            <TransactionFeePill amount={feeAmount} currencySymbol={currencySymbol} showEmptyState onPress={onFeePress} />
        </View>
    </View>
);
