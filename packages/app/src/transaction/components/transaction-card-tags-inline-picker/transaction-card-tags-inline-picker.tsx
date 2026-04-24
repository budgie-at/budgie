import { TagEntityInterface } from '@budgie/contracts';
import Animated, { FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';

import { TransactionCardTagChip } from '../transaction-card-tag-chip/transaction-card-tag-chip';

interface Props {
    readonly tags: readonly (TagEntityInterface & { readonly isPrimary: boolean })[];
    readonly onSelect: (tagId: number) => void;
}

const CHIP_STAGGER_MS = 30;
const CHIP_EXIT_DURATION_MS = 120;

export const TransactionCardTagsInlinePicker = ({ tags, onSelect }: Props) => (
    <Animated.View className="flex-row flex-wrap items-center gap-xs" layout={LinearTransition.springify()}>
        {tags.map((tag, index) => {
            const handlePress = () => void onSelect(tag.id);

            return (
                <Animated.View
                    key={tag.id}
                    entering={FadeInRight.springify().delay(index * CHIP_STAGGER_MS)}
                    exiting={FadeOutLeft.duration(CHIP_EXIT_DURATION_MS)}
                    layout={LinearTransition.springify()}
                >
                    <TransactionCardTagChip title={tag.title} isPrimary={tag.isPrimary} onPress={handlePress} />
                </Animated.View>
            );
        })}
    </Animated.View>
);
