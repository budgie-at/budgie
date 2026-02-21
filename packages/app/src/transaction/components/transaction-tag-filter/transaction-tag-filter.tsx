import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useTransactionTagFilterModal } from '../../context/transaction-tag-filter-modal.context';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionTagFilter = ({ value, onChange }: Props) => {
    const { t } = useLingui();
    const { openTransactionTagFilter } = useTransactionTagFilterModal();

    const handleOpen = async () => {
        const result = await openTransactionTagFilter({ value });

        if (isDefined(result)) {
            onChange(result.value);
        }
    };

    const selectedTagsCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedTagsCount) ? t`Tags (${selectedTagsCount})` : t`Tags`;

    return (
        <TransactionFilterChip
            isActive={isPositiveNumber(selectedTagsCount)}
            icon={UserIconNameEnum.Hash}
            label={label}
            onPress={handleOpen}
        />
    );
};
