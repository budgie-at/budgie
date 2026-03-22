import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

import type { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

export interface SplitEntriesModalParams {
    readonly entries: TransactionEntryCreateInputInterface[];
    readonly variant: ColorPaletteVariant;
    readonly entryType: TransactionEntryTypeEnum;
    readonly currencySymbol: string;
    readonly totalAmount: number;
}

export type SplitEntriesModalResult = TransactionEntryCreateInputInterface[] | null;

export const [SplitEntriesModalContext, useSplitEntriesModal] = createModalContext<SplitEntriesModalParams, SplitEntriesModalResult>(null);
