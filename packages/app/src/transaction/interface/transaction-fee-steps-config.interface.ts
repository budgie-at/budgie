import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import type { TransactionFeeModalResult } from '../context/transaction-fee-modal.context';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export interface TransactionFeeStepsConfigInterface {
    readonly accountId: number;
    readonly currencySymbol: string;
    readonly entry: TransactionEntryCreateInputInterface | null;
    readonly variant: ColorPaletteVariant;
    readonly isFeeActive: boolean;
    readonly shouldFocusOnMount: boolean;
    readonly onConfirm: (result: TransactionFeeModalResult) => void;
    readonly onShowFee: () => void;
    readonly onShowCategory: () => void;
    readonly onShowCreate: () => void;
}
