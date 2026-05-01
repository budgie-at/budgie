import type { TransactionFieldIconsRefInterface } from './transaction-field-icons-ref.interface';
import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import type { TransactionTypeEnum } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';
import type { RefObject } from 'react';

export interface TransactionFieldIconsPropsInterface {
    readonly ref?: RefObject<TransactionFieldIconsRefInterface | null>;
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly splitEntryCount?: number;
    readonly isAmountPositive?: boolean;
    readonly onCommentPress: EmptyFn;
    readonly onDatePress: EmptyFn;
    readonly onConsolidationPress?: EmptyFn;
    readonly onSplitPress?: EmptyFn;
    readonly categoryTestID?: string;
    readonly tagsTestID?: string;
    readonly commentTestID?: string;
}
