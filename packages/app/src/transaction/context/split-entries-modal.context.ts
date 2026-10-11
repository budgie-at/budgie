import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';

import type { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

interface SplitEntriesModalParams {
    readonly entries: TransactionEntryCreateInputInterface[];
    readonly variant: ColorPaletteVariant;
    readonly entryType: TransactionEntryTypeEnum;
    readonly currencySymbol: string;
    readonly totalAmount: number;
}

type SplitEntriesModalResult = TransactionEntryCreateInputInterface[] | null;

const [SplitEntriesModalContext, useSplitEntriesModal, useSplitEntriesModalParams] = createModalContext<
    SplitEntriesModalParams,
    SplitEntriesModalResult
>(null);

export { useSplitEntriesModal, useSplitEntriesModalParams };

export const SplitEntriesModalProvider = createModalProvider(SplitEntriesModalContext, '/split-entries');
