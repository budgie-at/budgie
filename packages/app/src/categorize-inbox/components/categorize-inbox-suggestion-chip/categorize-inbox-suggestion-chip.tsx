import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import { CategorizeInboxSuggestionChipSelector } from './categorize-inbox-suggestion-chip.selector';

import type { CategorizeInboxCandidateInterface } from '../../interface/categorize-inbox-candidate.interface';
import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly candidate: CategorizeInboxCandidateInterface;
    readonly index: number;
}

const PERCENT_MULTIPLIER = 100;

const chipVariants = cva('max-w-56 flex-row items-center gap-x-xs rounded-full border px-lg py-sm', {
    variants: {
        isTop: { true: 'border-primary bg-primary', false: 'border-secondary-corner bg-transparent' },
        isBusy: { true: 'opacity-50', false: '' }
    }
});

const labelVariants = cva('shrink text-sm font-medium', {
    variants: { isTop: { true: 'text-primary-reverse', false: 'text-primary' } }
});

const percentVariants = cva('text-xs', {
    variants: { isTop: { true: 'text-primary-reverse/70', false: 'text-secondary-foreground' } }
});

export const CategorizeInboxSuggestionChip = ({ cluster, candidate, index }: Props) => {
    const { categoriesById, isBusy, assignCluster } = useCategorizeInboxContext();

    const handlePress = (): void => void assignCluster(cluster, candidate.categoryId);

    const category = categoriesById.get(candidate.categoryId);
    const isTop = index === 0 && cluster.hasEvidence;
    const percentText = isTop && cluster.isConfident ? `${Math.round(candidate.probability * PERCENT_MULTIPLIER)}%` : null;

    if (!isDefined(category)) {
        return null;
    }

    return (
        <HapticPressable
            onPress={handlePress}
            disabled={isBusy}
            className={chipVariants({ isTop, isBusy })}
            accessibilityRole="button"
            accessibilityLabel={category.title}
            {...testID(CategorizeInboxSuggestionChipSelector.Chip, cluster.key, index)}
        >
            <Icon icon={category.icon} size={14} className={labelVariants({ isTop })} />
            <Text className={labelVariants({ isTop })} numberOfLines={1}>
                {category.title}
            </Text>
            {isDefined(percentText) ? <Text className={percentVariants({ isTop })}>{percentText}</Text> : null}
        </HapticPressable>
    );
};
