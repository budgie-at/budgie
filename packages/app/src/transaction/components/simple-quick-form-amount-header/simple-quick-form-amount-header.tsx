import { ReactNode } from 'react';
import { View } from 'react-native';

import { RulePillSlot } from '../rule-pill-slot/rule-pill-slot';

import type { RuleDetectionType } from '../../interface/rule-detection.type';

interface Props {
    readonly ruleDetection?: RuleDetectionType;
    readonly amountTopContent?: ReactNode;
}

export const SimpleQuickFormAmountHeader = ({ amountTopContent, ruleDetection }: Props) => (
    <View className="h-[76px] items-center justify-end gap-xs">
        <RulePillSlot ruleDetection={ruleDetection} />
        {amountTopContent}
    </View>
);
