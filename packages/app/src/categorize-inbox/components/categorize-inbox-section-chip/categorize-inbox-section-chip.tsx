import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';

import { CategorizeInboxSectionChipSelector } from './categorize-inbox-section-chip.selector';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly count: number;
    readonly onPress: (section: CategorizeInboxSectionEnum) => void;
}

const continuousCorners = { borderCurve: 'continuous' as const };

const chipVariants = cva('h-[36px] flex-row items-center rounded-2xl px-lg active:opacity-70', {
    variants: {
        section: {
            [CategorizeInboxSectionEnum.CONFIDENT]: 'bg-positive-tonal',
            [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: 'bg-warning-fill/15',
            [CategorizeInboxSectionEnum.REVIEW]: 'bg-surface-fill',
            [CategorizeInboxSectionEnum.ONE_OFFS]: 'bg-surface-fill'
        }
    }
});

const labelVariants = cva('text-[15px] font-semibold tabular-nums', {
    variants: {
        section: {
            [CategorizeInboxSectionEnum.CONFIDENT]: 'text-positive-action',
            [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: 'text-attention-foreground',
            [CategorizeInboxSectionEnum.REVIEW]: 'text-primary',
            [CategorizeInboxSectionEnum.ONE_OFFS]: 'text-primary'
        }
    }
});

export const CategorizeInboxSectionChip = ({ section, count, onPress }: Props) => {
    const { t } = useLingui();

    const sectionLabels: Record<CategorizeInboxSectionEnum, string> = {
        [CategorizeInboxSectionEnum.CONFIDENT]: t({ context: 'Categorize inbox section chip', message: 'Ready' }),
        [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: t({ context: 'Categorize inbox section chip', message: 'Cash' }),
        [CategorizeInboxSectionEnum.REVIEW]: t({ context: 'Categorize inbox section chip', message: 'Your call' }),
        [CategorizeInboxSectionEnum.ONE_OFFS]: t({ context: 'Categorize inbox section chip', message: 'Other' })
    };
    const label = sectionLabels[section];

    const handlePress = (): void => void onPress(section);

    return (
        <HapticPressable
            className={chipVariants({ section })}
            style={continuousCorners}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${count}`}
            {...testID(CategorizeInboxSectionChipSelector.Chip, section)}
        >
            <Text className={labelVariants({ section })} numberOfLines={1}>
                {`${label} `}
                <Text className="font-normal opacity-70">{count}</Text>
            </Text>
        </HapticPressable>
    );
};
