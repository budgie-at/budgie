import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

interface TransactionFeeModalParamsInterface {
    readonly accountId: number;
    readonly currencySymbol: string;
    readonly entry: TransactionEntryCreateInputInterface | null;
    readonly variant: ColorPaletteVariant;
}

export type TransactionFeeModalResult = readonly TransactionEntryCreateInputInterface[];

const [TransactionFeeModalContext, useTransactionFeeModal, useTransactionFeeModalParams] = createModalContext<
    TransactionFeeModalParamsInterface,
    TransactionFeeModalResult | null
>(null);

export { useTransactionFeeModal, useTransactionFeeModalParams };

export const TransactionFeeModalProvider = createModalProvider(TransactionFeeModalContext, '/transaction-fee');
