import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export interface TransactionFeeModalParamsInterface {
    readonly accountId: number;
    readonly currencySymbol: string;
    readonly entry: TransactionEntryCreateInputInterface | null;
    readonly variant: ColorPaletteVariant;
}

export type TransactionFeeModalResult = readonly TransactionEntryCreateInputInterface[];

export const [TransactionFeeModalContext, useTransactionFeeModal] = createModalContext<
    TransactionFeeModalParamsInterface,
    TransactionFeeModalResult | null
>(null);
