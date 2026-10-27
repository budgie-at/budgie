import type { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import type { TransactionAmountDisplayRef } from '../components/transaction-amount-display/transaction-amount-display';
import type { useSimpleQuickFormState } from '../hook/use-simple-quick-form-state.hook';
import type { KeypadHandlersInterface } from './keypad-handlers.interface';
import type { QuickFormAccountFieldName } from './quick-form-account-field-name.type';
import type { TransactionTypeEnum } from '@budgie/contracts';
import type { RefObject } from 'react';

export interface SimpleQuickFormContextValueInterface {
    readonly variant: ColorPaletteVariant;
    readonly transactionType: TransactionTypeEnum;
    readonly accountFieldName: QuickFormAccountFieldName;
    readonly aiContext: string;
    readonly isNewTransaction: boolean;
    readonly currencySymbol: string;
    readonly keypadHandlers: KeypadHandlersInterface;
    readonly setFromNumeric: (value: number) => void;
    readonly formState: ReturnType<typeof useSimpleQuickFormState>;
    readonly amountDisplayRef: RefObject<TransactionAmountDisplayRef | null>;
    readonly onSubmit: () => void;
    readonly onCancel: () => void;
}
