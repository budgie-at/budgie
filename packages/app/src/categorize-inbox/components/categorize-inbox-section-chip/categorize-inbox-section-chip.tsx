import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

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

const ACTIVE_SURFACE_CLASS_NAME: Record<CategorizeInboxSectionEnum, string> = {
    [CategorizeInboxSectionEnum.CONFIDENT]: 'bg-positive-action',
    [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: 'bg-cash-action',
    [CategorizeInboxSectionEnum.REVIEW]: 'bg-primary',
    [CategorizeInboxSectionEnum.ONE_OFFS]: 'bg-primary'
};

const ACTIVE_LABEL_CLASS_NAME: Record<CategorizeInboxSectionEnum, string> = {
    [CategorizeInboxSectionEnum.CONFIDENT]: 'text-positive-action-foreground',
    [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: 'text-cash-action-foreground',
    [CategorizeInboxSectionEnum.REVIEW]: 'text-primary-reverse',
    [CategorizeInboxSectionEnum.ONE_OFFS]: 'text-primary-reverse'
};

const INACTIVE_DOT_CLASS_NAME: Record<CategorizeInboxSectionEnum, string | null> = {
    [CategorizeInboxSectionEnum.CONFIDENT]: 'bg-positive-action',
    [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: 'bg-cash-action',
    [CategorizeInboxSectionEnum.REVIEW]: null,
    [CategorizeInboxSectionEnum.ONE_OFFS]: null
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
    const surfaceClassName = isActive ? ACTIVE_SURFACE_CLASS_NAME[section] : 'bg-surface-fill';
    const labelClassName = isActive ? ACTIVE_LABEL_CLASS_NAME[section] : 'text-primary';
    const countClassName = isActive ? 'opacity-70' : 'text-secondary-foreground';
    const dotClassName = isActive ? null : INACTIVE_DOT_CLASS_NAME[section];
    const dot = isDefined(dotClassName) ? <View className={cn('size-[8px] rounded-full', dotClassName)} /> : null;

    return (
        <HapticPressable
            className={cn('h-[36px] flex-row items-center gap-x-sm rounded-2xl px-lg active:opacity-70', surfaceClassName)}
            style={continuousCorners}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            accessibilityLabel={`${label} ${count}`}
            {...testID(CategorizeInboxSectionChipSelector.Chip, section)}
        >
            {dot}
            <Text className={cn('text-[15px] font-semibold tabular-nums', labelClassName)} numberOfLines={1}>
                {`${label} `}
                <Text className={cn('font-normal', countClassName)}>{count}</Text>
            </Text>
        </HapticPressable>
    );
};
