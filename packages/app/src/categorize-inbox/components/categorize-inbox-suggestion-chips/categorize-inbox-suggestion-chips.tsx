import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxSuggestionChip } from '../categorize-inbox-suggestion-chip/categorize-inbox-suggestion-chip';

import { CategorizeInboxSuggestionChipsSelector } from './categorize-inbox-suggestion-chips.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

const VISIBLE_CANDIDATE_COUNT = 3;

const moreChipVariants = cva('flex-row items-center gap-x-xs rounded-full border border-dashed border-secondary-corner px-lg py-sm', {
    variants: { isBusy: { true: 'opacity-50', false: '' } }
});

export const CategorizeInboxSuggestionChips = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { isBusy, assignCluster } = useCategorizeInboxContext();
    const [openCategorySelector] = useCategorySelectorModal();

    const handleMore = async (): Promise<void> => {
        const categoryId = await openCategorySelector({ description: cluster.displayTitle });

        if (isDefined(categoryId)) {
            assignCluster(cluster, categoryId);
        }
    };

    const handleMorePress = (): void => void handleMore();

    return (
        <View className="flex-row flex-wrap gap-sm">
            {cluster.candidates.slice(0, VISIBLE_CANDIDATE_COUNT).map((candidate, index) => (
                <CategorizeInboxSuggestionChip key={candidate.categoryId} cluster={cluster} candidate={candidate} index={index} />
            ))}

            <HapticPressable
                onPress={handleMorePress}
                disabled={isBusy}
                className={moreChipVariants({ isBusy })}
                accessibilityRole="button"
                accessibilityLabel={t`More categories`}
                {...testID(CategorizeInboxSuggestionChipsSelector.More, cluster.key)}
            >
                <Icon icon={UserIconNameEnum.Ellipsis} size={14} className="text-secondary-foreground" />
                <Text className="text-secondary-foreground text-sm font-medium">
                    <Trans>More…</Trans>
                </Text>
            </HapticPressable>
        </View>
    );
};
