import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';

import type { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

export interface SplitEntriesModalParams {
    readonly entries: TransactionEntryCreateInputInterface[];
    readonly variant: ColorPaletteVariant;
    readonly entryType: TransactionEntryTypeEnum;
    readonly currencySymbol: string;
}

export type SplitEntriesModalResult = TransactionEntryCreateInputInterface[] | null;

interface ResolveOptions {
    readonly skipBack?: boolean;
}

interface SplitEntriesModalContextInterface {
    openSplitEntries: (params: SplitEntriesModalParams) => Promise<SplitEntriesModalResult>;
    resolveSplitEntries: (result: SplitEntriesModalResult, options?: ResolveOptions) => void;
    currentParams: SplitEntriesModalParams | null;
}

export const SplitEntriesModalContext = createContext<SplitEntriesModalContextInterface>({
    openSplitEntries: () => Promise.resolve(null),
    resolveSplitEntries: emptyFn,
    currentParams: null
});

export const useSplitEntriesModal = () => use(SplitEntriesModalContext);
