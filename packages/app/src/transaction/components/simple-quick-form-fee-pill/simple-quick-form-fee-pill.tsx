import { TransactionFeePill } from '../transaction-fee-pill/transaction-fee-pill';

interface Props {
    readonly amount: number;
    readonly currencySymbol: string;
    readonly showInlineAction: boolean;
    readonly onPress: () => void;
}

export const SimpleQuickFormFeePill = ({ amount, currencySymbol, showInlineAction, onPress }: Props) => {
    if (!showInlineAction) {
        return null;
    }

    return <TransactionFeePill amount={amount} currencySymbol={currencySymbol} showEmptyState onPress={onPress} />;
};
