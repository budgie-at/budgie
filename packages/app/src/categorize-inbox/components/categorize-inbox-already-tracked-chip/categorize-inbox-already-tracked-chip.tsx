import { CategorizeInboxLabelKindEnum } from '@budgie/categorization';
import { CASH_WITHDRAWAL_TRACKED_CATEGORY_ID, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { SuggestionPillContent } from '../../../transaction/components/suggestion-pill-content/suggestion-pill-content';
import { categorizeInboxChipVariants } from '../../constant/categorize-inbox-chip-variants.constant';
import { CATEGORIZE_INBOX_RAIL_HIT_SLOP } from '../../constant/categorize-inbox-rail-hit-slop.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import { CategorizeInboxAlreadyTrackedChipSelector } from './categorize-inbox-already-tracked-chip.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxAlreadyTrackedChip = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { strategy, assignCluster } = useCategorizeInboxContext();

    const handlePress = (): void => void assignCluster(cluster, CASH_WITHDRAWAL_TRACKED_CATEGORY_ID);

    if (strategy.labelKind !== CategorizeInboxLabelKindEnum.CATEGORY) {
        return null;
    }

    return (
        <HapticPressable
            onPress={handlePress}
            hitSlop={CATEGORIZE_INBOX_RAIL_HIT_SLOP}
            className={categorizeInboxChipVariants({ variant: 'ghost' })}
            accessibilityRole="button"
            accessibilityLabel={t`Keep as already tracked cash, not spending`}
            {...testID(CategorizeInboxAlreadyTrackedChipSelector.Chip, cluster.key)}
        >
            <SuggestionPillContent icon={UserIconNameEnum.CheckCheck} title={t`Already tracked`} />
        </HapticPressable>
    );
};
