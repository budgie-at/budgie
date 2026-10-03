import { CategorizeInboxAlreadyTrackedChip } from '../categorize-inbox-already-tracked-chip/categorize-inbox-already-tracked-chip';
import { CategorizeInboxMoveToCashChip } from '../categorize-inbox-move-to-cash-chip/categorize-inbox-move-to-cash-chip';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxCashWithdrawalChips = ({ cluster }: Props) => (
    <>
        <CategorizeInboxMoveToCashChip cluster={cluster} />
        <CategorizeInboxAlreadyTrackedChip cluster={cluster} />
    </>
);
