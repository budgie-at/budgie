import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cn } from 'cn';

import { isNotEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { testID } from '../../../@generic/utils/test-id.util';
import { SuggestionPillContent } from '../../../transaction/components/suggestion-pill-content/suggestion-pill-content';
import { categorizeInboxChipVariants } from '../../constant/categorize-inbox-chip-variants.constant';
import { CATEGORIZE_INBOX_RAIL_HIT_SLOP } from '../../constant/categorize-inbox-rail-hit-slop.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useMoveToCashTransactionIdsQuery } from '../../query/use-move-to-cash-transaction-ids.query';

import { CategorizeInboxMoveToCashChipSelector } from './categorize-inbox-move-to-cash-chip.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxMoveToCashChip = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { includedRows, moveToCash } = useCategorizeInboxContext();
    const eligibleTransactionIds = useMoveToCashTransactionIdsQuery(cluster.rows);

    const transactionIds = includedRows(cluster)
        .map(row => row.transactionId)
        .filter(transactionId => eligibleTransactionIds.includes(transactionId));
    const accessibilityLabel = t({
        message: plural(transactionIds.length, { one: 'Move # withdrawal to cash', other: 'Move # withdrawals to cash' })
    });

    const handlePress = (): void => void moveToCash(transactionIds);

    if (!isNotEmptyArray(transactionIds)) {
        return null;
    }

    return (
        <HapticPressable
            onPress={handlePress}
            hitSlop={CATEGORIZE_INBOX_RAIL_HIT_SLOP}
            className={cn(categorizeInboxChipVariants({ variant: 'primary' }), 'shrink')}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            {...testID(CategorizeInboxMoveToCashChipSelector.Chip, cluster.key)}
        >
            <SuggestionPillContent icon={UserIconNameEnum.Banknote} title={t`Move to cash`} />
        </HapticPressable>
    );
};
