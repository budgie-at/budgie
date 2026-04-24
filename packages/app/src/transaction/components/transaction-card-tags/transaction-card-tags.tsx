import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { usePromotePrimaryTag } from '../../hook/use-promote-primary-tag.hook';
import { sortTransactionTagsByPrimary } from '../../utils/sort-transaction-tags-by-primary.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionCardTagChip } from '../transaction-card-tag-chip/transaction-card-tag-chip';
import { TransactionCardTagsInlinePicker } from '../transaction-card-tags-inline-picker/transaction-card-tags-inline-picker';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const COLLAPSE_DELAY_MS = 3000;

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const TransactionCardTags = ({ transaction }: Props) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { promote } = usePromotePrimaryTag(transaction.id);

    const sorted = sortTransactionTagsByPrimary(transaction.transactionTags);
    const [primaryRow] = sorted;
    const primaryTag = isDefined(primaryRow) ? primaryRow.tag : null;
    const hasMultipleTags = sorted.length > 1;
    const siblingsCount = sorted.length - 1;

    const handleLongPress = async () => {
        if (!hasMultipleTags) {
            return;
        }

        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsExpanded(true);
    };

    const handleSelect = async (tagId: number) => {
        setIsExpanded(false);
        if (isDefined(primaryRow) && tagId === primaryRow.tagId) {
            return;
        }

        await promote(tagId);
    };

    useEffect(() => {
        if (!isExpanded) {
            return undefined; // eslint-disable-line no-undefined -- consistent-return: early exit before cleanup registration
        }

        const timeoutId = setTimeout(() => void setIsExpanded(false), COLLAPSE_DELAY_MS);

        return () => void clearTimeout(timeoutId);
    }, [isExpanded]);

    if (!isNotEmptyArray(sorted) || !isDefined(primaryTag)) {
        return null;
    }

    if (isExpanded) {
        const tagsWithMeta = sorted.map(row => ({ ...row.tag, isPrimary: row.isPrimary }));

        return (
            <View className="flex-row items-center" testID={TransactionCardSelector.Tag(primaryTag.title)}>
                <TransactionCardTagsInlinePicker tags={tagsWithMeta} onSelect={handleSelect} />
            </View>
        );
    }

    return (
        <Animated.View className="flex-row items-center gap-x-xs" layout={LinearTransition.springify()} testID={TransactionCardSelector.Tag(primaryTag.title)}>
            <TransactionCardTagChip title={primaryTag.title} isPrimary={hasMultipleTags} onLongPress={handleLongPress} />
            {hasMultipleTags ? (
                <View className="rounded-full border border-secondary-corner px-sm py-[2px]">
                    <Text className="text-xs text-secondary-foreground">{`+${siblingsCount}`}</Text>
                </View>
            ) : null}
        </Animated.View>
    );
};
