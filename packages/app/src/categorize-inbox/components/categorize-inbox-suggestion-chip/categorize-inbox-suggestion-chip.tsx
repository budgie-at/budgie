import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cn } from 'cn';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { SuggestionPillContent } from '../../../transaction/components/suggestion-pill-content/suggestion-pill-content';
import { categorizeInboxChipVariants } from '../../constant/categorize-inbox-chip-variants.constant';
import { CATEGORIZE_INBOX_RAIL_HIT_SLOP } from '../../constant/categorize-inbox-rail-hit-slop.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import { CategorizeInboxSuggestionChipSelector } from './categorize-inbox-suggestion-chip.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { CategorizeInboxCandidateInterface } from '../../interface/categorize-inbox-candidate.interface';
import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly candidate: CategorizeInboxCandidateInterface;
    readonly index: number;
}

export const CategorizeInboxSuggestionChip = ({ cluster, candidate, index }: Props) => {
    const { t } = useLingui();
    const { categoriesById, assignCluster } = useCategorizeInboxContext();

    const handlePress = (): void => void assignCluster(cluster, candidate.categoryId);

    const category = categoriesById.get(candidate.categoryId);
    const isTopCandidate = index === 0;
    const isConfident = cluster.isConfident && isTopCandidate;
    const topVariant: ColorPaletteVariant = isConfident ? 'positive' : 'ghost';
    const variant: ColorPaletteVariant = isTopCandidate ? topVariant : 'primary';

    if (!isDefined(category)) {
        return null;
    }

    const categoryTitle = category.title;

    return (
        <HapticPressable
            onPress={handlePress}
            hitSlop={CATEGORIZE_INBOX_RAIL_HIT_SLOP}
            className={cn(categorizeInboxChipVariants({ variant }), 'shrink')}
            accessibilityRole="button"
            accessibilityLabel={t`Categorize as ${categoryTitle}`}
            {...testID(CategorizeInboxSuggestionChipSelector.Chip, cluster.key, index)}
        >
            <SuggestionPillContent icon={category.icon} title={categoryTitle} />
            {isConfident ? <Icon icon={UserIconNameEnum.Check} size={14} className="text-positive-foreground" /> : null}
        </HapticPressable>
    );
};
