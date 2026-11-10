import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import type { ModalResult } from '../../@generic/type/modal-result.type';
import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export interface TransactionFeeStepsConfigInterface {
    readonly accountId: number;
    readonly currencySymbol: string;
    readonly entry: TransactionEntryCreateInputInterface | null;
    readonly variant: ColorPaletteVariant;
    readonly isFeeActive: boolean;
    readonly onConfirm: (result: ModalResult<'/transaction-fee'>) => void;
    readonly onShowFee: () => void;
    readonly onShowCategory: () => void;
    readonly onShowCreate: () => void;
    readonly onDone?: () => void;
}
