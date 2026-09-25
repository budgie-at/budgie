import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { SuggestionPillContent } from '../../../transaction/components/suggestion-pill-content/suggestion-pill-content';
import { categorizeInboxChipVariants } from '../../constant/categorize-inbox-chip-variants.constant';
import { CATEGORIZE_INBOX_RAIL_HIT_SLOP } from '../../constant/categorize-inbox-rail-hit-slop.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxSectionEnum } from '../../enum/categorize-inbox-section.enum';
import { CategorizeInboxSuggestionChip } from '../categorize-inbox-suggestion-chip/categorize-inbox-suggestion-chip';

import { CategorizeInboxSuggestionChipsSelector } from './categorize-inbox-suggestion-chips.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxSuggestionChips = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { assignCluster } = useCategorizeInboxContext();
    const [openCategorySelector] = useCategorySelectorModal();

    const handlePickCategory = async (): Promise<void> => {
        const categoryId = await openCategorySelector({ description: cluster.displayTitle });

        if (isDefined(categoryId)) {
            assignCluster(cluster, categoryId);
        }
    };

    const handlePickCategoryPress = (): void => void handlePickCategory();

    const isTransfer = isDefined(cluster.transferKind);
    const candidateLimit = cluster.section === CategorizeInboxSectionEnum.ONE_OFFS ? 1 : 2;
    const candidates = isTransfer ? [] : cluster.candidates.slice(0, candidateLimit);

    if (isEmptyArray(candidates) && !isTransfer) {
        return (
            <HapticPressable
                onPress={handlePickCategoryPress}
                hitSlop={CATEGORIZE_INBOX_RAIL_HIT_SLOP}
                className={categorizeInboxChipVariants({ variant: 'ghost' })}
                accessibilityRole="button"
                {...testID(CategorizeInboxSuggestionChipsSelector.SelectCategory, cluster.key)}
            >
                <SuggestionPillContent icon={UserIconNameEnum.Shapes} title={t`Select category`} />
            </HapticPressable>
        );
    }

    return (
        <>
            {candidates.map((candidate, index) => (
                <CategorizeInboxSuggestionChip key={candidate.categoryId} cluster={cluster} candidate={candidate} index={index} />
            ))}

            <HapticPressable
                onPress={handlePickCategoryPress}
                hitSlop={CATEGORIZE_INBOX_RAIL_HIT_SLOP}
                className="ml-auto h-10 w-10 items-center justify-center rounded-xl border border-secondary-corner"
                accessibilityRole="button"
                accessibilityLabel={t`More categories`}
                {...testID(CategorizeInboxSuggestionChipsSelector.More, cluster.key)}
            >
                <Icon icon={UserIconNameEnum.Ellipsis} size={16} className="text-secondary-foreground" />
            </HapticPressable>
        </>
    );
};
