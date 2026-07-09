import { ReactNode } from 'react';
import { View } from 'react-native';

import { RulePillSlot } from '../rule-pill-slot/rule-pill-slot';

import type { RulePillSlotPropsInterface } from '../../interface/rule-pill-slot-props.interface';

interface Props extends RulePillSlotPropsInterface {
    readonly amountTopContent?: ReactNode;
}

export const SimpleQuickFormAmountHeader = ({
    amountTopContent,
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
        {amountTopContent}
    </View>
);
