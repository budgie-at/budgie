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

const CHIP_HIT_SLOP = { top: 4, bottom: 4 } as const;

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
    const surfaceClassName = isActive ? 'bg-primary' : 'bg-surface-fill';
    const labelClassName = isActive ? 'text-primary-reverse' : 'text-primary';
    const countClassName = isActive ? 'opacity-70' : 'text-secondary-foreground';

    return (
        <HapticPressable
            className={cn('min-h-[36px] flex-row items-center rounded-2xl px-lg py-sm active:opacity-70', surfaceClassName)}
            style={continuousCorners}
            hitSlop={CHIP_HIT_SLOP}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            accessibilityLabel={`${label} ${count}`}
            {...testID(CategorizeInboxSectionChipSelector.Chip, section)}
        >
            <Text className={cn('text-[15px] font-semibold tabular-nums', labelClassName)} numberOfLines={1}>
                {`${label} `}
                <Text className={cn('font-normal', countClassName)}>{count}</Text>
            </Text>
        </HapticPressable>
    );
};
