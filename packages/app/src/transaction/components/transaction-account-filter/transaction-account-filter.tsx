import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { AccountsSelectorBottomSheet } from '../../../account/component/accounts-selector-bottom-sheet/accounts-selector-bottom-sheet';
import { toggleFilterSelection } from '../../utils/toggle-filter-selection.util';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionAccountFilter = ({ value, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const selectedAccountsCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedAccountsCount) ? t`Accounts (${selectedAccountsCount})` : t`Accounts`;

    const handleOpen = () => void ref.current?.open();

    const handleSelect = (...accountIds: number[]) => {
        onChange(toggleFilterSelection(value, accountIds));
    };

    const handleClear = () => void onChange(null);

    return (
        <>
            <TransactionFilterChip
                isActive={isPositiveNumber(selectedAccountsCount)}
                icon={UserIconNameEnum.Wallet}
                label={label}
                onPress={handleOpen}
            />

            <AccountsSelectorBottomSheet ref={ref} selectedAccountIds={value ?? []} onSelect={handleSelect} onClear={handleClear} />
        </>
    );
};
