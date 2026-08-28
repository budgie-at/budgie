import { InstrumentTypeEnum } from '@budgie/contracts';

import { TransactionFeePill } from '../transaction-fee-pill/transaction-fee-pill';

interface Props {
    readonly amount: number;
    readonly currencySymbol: string;
    readonly instrumentType: InstrumentTypeEnum;
    readonly showInlineAction: boolean;
    readonly onPress: () => void;
}

export const SimpleQuickFormFeePill = ({ amount, currencySymbol, instrumentType, showInlineAction, onPress }: Props) => {
    if (!showInlineAction) {
        return null;
    }

    return (
        <TransactionFeePill
            amount={amount}
            currencySymbol={currencySymbol}
            instrumentType={instrumentType}
            showEmptyState
            onPress={onPress}
        />
    );
};
