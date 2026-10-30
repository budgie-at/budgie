import { useLingui } from '@lingui/react/macro';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxTonalCapsuleVariantEnum } from '../../enum/categorize-inbox-tonal-capsule-variant.enum';
import { CategorizeInboxTonalCapsule } from '../categorize-inbox-tonal-capsule/categorize-inbox-tonal-capsule';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

export const CategorizeInboxPaymentsSelectAll = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { includedRows, setExcluded } = useCategorizeInboxContext();

    const isAllSelected = includedRows(cluster).length === cluster.rows.length;
    const label = isAllSelected ? t`Deselect all` : t`Select all`;

    const handlePress = (): void =>
        void setExcluded(
            cluster.rows.map(row => row.transactionId),
            isAllSelected
        );

    return (
        <HapticPressable onPress={handlePress} accessibilityRole="button" hitSlop={HIT_SLOP} className="active:opacity-70">
            <CategorizeInboxTonalCapsule label={label} variant={CategorizeInboxTonalCapsuleVariantEnum.NEUTRAL} />
        </HapticPressable>
    );
};
