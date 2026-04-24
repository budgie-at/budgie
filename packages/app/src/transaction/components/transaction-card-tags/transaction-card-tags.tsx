import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useAutoCollapse } from '../../hook/use-auto-collapse.hook';
import { usePromotePrimaryTag } from '../../hook/use-promote-primary-tag.hook';
import { derivePrimaryTagView } from '../../utils/derive-primary-tag-view.util';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';
import { TransactionCardTagChip } from '../transaction-card-tag-chip/transaction-card-tag-chip';
import { TransactionCardTagsInlinePicker } from '../transaction-card-tags-inline-picker/transaction-card-tags-inline-picker';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const COLLAPSE_DELAY_MS = 3000;

export const TransactionCardTags = ({ transaction }: Props) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { promote } = usePromotePrimaryTag(transaction.id);

    const { sorted, primaryRow, primaryTag, hasMultipleTags, siblingsCount } = derivePrimaryTagView(transaction.transactionTags);

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

    useAutoCollapse(isExpanded, () => void setIsExpanded(false), COLLAPSE_DELAY_MS);

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
        <Animated.View
            className="flex-row items-center gap-x-xs"
            layout={LinearTransition.springify()}
            testID={TransactionCardSelector.Tag(primaryTag.title)}
        >
            <TransactionCardTagChip title={primaryTag.title} isPrimary={hasMultipleTags} onLongPress={handleLongPress} />
            {hasMultipleTags ? (
                <View className="rounded-full border border-secondary-corner px-sm py-[2px]">
                    <Text className="text-xs text-secondary-foreground">{`+${siblingsCount}`}</Text>
                </View>
            ) : null}
        </Animated.View>
    );
};
