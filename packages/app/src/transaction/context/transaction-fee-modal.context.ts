import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export interface TransactionFeeModalParams {
    readonly accountId: number;
    readonly currencySymbol: string;
    readonly entry: TransactionEntryCreateInputInterface | null;
    readonly variant: ColorPaletteVariant;
}

export interface TransactionFeeModalResult {
    readonly entry: TransactionEntryCreateInputInterface | null;
    readonly shouldRemove: boolean;
}

export const [TransactionFeeModalContext, useTransactionFeeModal] = createModalContext<
    TransactionFeeModalParams,
    TransactionFeeModalResult | null
>(null);
