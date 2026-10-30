import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { cn } from '../../../@generic/utils/cn.util';
import { testID } from '../../../@generic/utils/test-id.util';

import { CategorizeInboxSectionChipSelector } from './categorize-inbox-section-chip.selector';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly count: number;
    readonly isActive: boolean;
    readonly onPress: (section: CategorizeInboxSectionEnum) => void;
}

const continuousCorners = { borderCurve: 'continuous' as const };

const SURFACE_CLASS_NAME: Record<CategorizeInboxSectionEnum, Record<'active' | 'inactive', string>> = {
    [CategorizeInboxSectionEnum.CONFIDENT]: { active: 'bg-positive-action', inactive: 'bg-positive-tonal' },
    [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: { active: 'bg-cash-action', inactive: 'bg-cash-tonal' },
    [CategorizeInboxSectionEnum.REVIEW]: { active: 'bg-primary', inactive: 'bg-surface-fill' },
    [CategorizeInboxSectionEnum.ONE_OFFS]: { active: 'bg-primary', inactive: 'bg-surface-fill' }
};

const LABEL_CLASS_NAME: Record<CategorizeInboxSectionEnum, Record<'active' | 'inactive', string>> = {
    [CategorizeInboxSectionEnum.CONFIDENT]: { active: 'text-positive-action-foreground', inactive: 'text-positive-action' },
    [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: { active: 'text-cash-action-foreground', inactive: 'text-cash-action' },
    [CategorizeInboxSectionEnum.REVIEW]: { active: 'text-primary-reverse', inactive: 'text-primary' },
    [CategorizeInboxSectionEnum.ONE_OFFS]: { active: 'text-primary-reverse', inactive: 'text-primary' }
};

export const CategorizeInboxSectionChip = ({ section, count, isActive, onPress }: Props) => {
    const { t } = useLingui();

    const sectionLabels: Record<CategorizeInboxSectionEnum, string> = {
        [CategorizeInboxSectionEnum.CONFIDENT]: t({ context: 'Categorize inbox section chip', message: 'Ready' }),
        [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: t({ context: 'Categorize inbox section chip', message: 'Cash' }),
        [CategorizeInboxSectionEnum.REVIEW]: t({ context: 'Categorize inbox section chip', message: 'Your call' }),
        [CategorizeInboxSectionEnum.ONE_OFFS]: t({ context: 'Categorize inbox section chip', message: 'Other' })
    };
    const label = sectionLabels[section];

    const handlePress = (): void => void onPress(section);
    const accessibilityState = { selected: isActive };
    const state = isActive ? 'active' : 'inactive';

    return (
        <HapticPressable
            className={cn('h-[36px] flex-row items-center rounded-2xl px-lg active:opacity-70', SURFACE_CLASS_NAME[section][state])}
            style={continuousCorners}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            accessibilityLabel={`${label} ${count}`}
            {...testID(CategorizeInboxSectionChipSelector.Chip, section)}
        >
            <Text className={cn('text-[15px] font-semibold tabular-nums', LABEL_CLASS_NAME[section][state])} numberOfLines={1}>
                {`${label} `}
                <Text className="font-normal opacity-70">{count}</Text>
            </Text>
        </HapticPressable>
    );
};
