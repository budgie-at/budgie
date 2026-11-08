import {
    TransactionAssociationEnum,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionUpdateServiceInputInterface,
    TransactionWithRelationsEntityInterface,
    isPositiveAdjustmentTransaction,
    convertFromMicroUnits
} from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useReducer, useRef } from 'react';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { AmountSignPill } from '../../../@generic/component/amount-sign-pill/amount-sign-pill';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { useKeypadInput } from '../../hook/use-keypad-input.hook';
import { useTransactionKeypadEditing } from '../../hook/use-transaction-keypad-editing.hook';
import { formatKeypadAmount } from '../../utils/format-keypad-amount.util';
import { AdjustmentAccountSummary } from '../adjustment-account-summary/adjustment-account-summary';
import { QuickFormLayout } from '../quick-form-layout/quick-form-layout';
import { QuickFormSecondaryLine } from '../quick-form-secondary-line/quick-form-secondary-line';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFormActions } from '../transaction-form-actions/transaction-form-actions';
import { TransactionKeypadDismissButton } from '../transaction-keypad-dismiss-button/transaction-keypad-dismiss-button';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { AdjustmentTransactionDetailsInterface } from '../../interface/adjustment-transaction-details.interface';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
}

const buildAdjustmentEntry = (
    details: AdjustmentTransactionDetailsInterface,
    amount: number,
    isIncrease: boolean
): TransactionEntryCreateInputInterface => ({
    accountId: details.accountId,
    categoryId: null,
    mccCategoryId: null,
    amount,
    type: isIncrease ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT,
    externalId: details.entry.externalId ?? null,
    exchangeRate: details.entry.exchangeRate ?? 1,
    baseInstrumentId: details.entry.baseInstrumentId,
    baseExchangeRate: details.entry.baseExchangeRate,
    baseAmount: details.entry.baseAmount,
    toIban: details.entry.toIban
});

const buildAdjustmentUpdateInput = (
    transaction: TransactionWithRelationsEntityInterface,
    details: AdjustmentTransactionDetailsInterface,
    amount: number,
    isIncrease: boolean
): TransactionUpdateServiceInputInterface => ({
    title: transaction.title,
    comment: transaction.comment,
    type: TransactionTypeEnum.ADJUSTMENT,
    operatedAt: transaction.operatedAt,
    fromAccountId: isIncrease ? null : details.accountId,
    toAccountId: isIncrease ? details.accountId : null,
    exchangeRate: transaction.exchangeRate,
    tagIds: transaction[TransactionAssociationEnum.TRANSACTION_TAGS].map(transactionTag => transactionTag.tagId),
    entries: [buildAdjustmentEntry(details, amount, isIncrease)]
});

const getAdjustmentDetails = (transaction: TransactionWithRelationsEntityInterface): AdjustmentTransactionDetailsInterface | null => {
    const initialIsIncrease = isPositiveAdjustmentTransaction(transaction);
    const entryType = initialIsIncrease ? TransactionEntryTypeEnum.DEBIT : TransactionEntryTypeEnum.CREDIT;
    const entry = transaction.entries.find(item => item.type === entryType);

    if (!isDefined(entry)) {
        return null;
    }

    return {
        accountId: entry.accountId,
        accountTitle: entry.account.title,
        accountIcon: entry.account.icon,
        instrumentCode: entry.account.instrument.code,
        instrumentSymbol: entry.account.instrument.symbol,
        initialAmount: convertFromMicroUnits(entry.amount),
        initialIsIncrease,
        entry
    };
};

export const UpdateAdjustmentTransaction = ({ transaction, transactionId }: Props) => {
    const { t } = useLingui();
    const { markForEmbedding } = useEmbeddingGenerator();
    const amountDisplayRef = useRef<TransactionAmountDisplayRef | null>(null);
    const { isEditingAmount, toggleKeypad, dismissKeypad, amountAccessibilityHint } = useTransactionKeypadEditing(false);
    const details = getAdjustmentDetails(transaction);
    const { isLoading: isSubmitting, run } = useSingleFlight();
    const [isIncrease, toggleIsIncrease] = useReducer((current: boolean) => !current, details?.initialIsIncrease ?? true);
    const { displayValue, numericValue, handlers } = useKeypadInput({
        initialValue: details?.initialAmount ?? 0
    });

    if (!isDefined(details)) {
        return null;
    }

    const variant: ColorPaletteVariant = isIncrease ? 'positive' : 'primary';
    const display = {
        symbol: `${isIncrease ? '+' : '\u2212'}${details.instrumentSymbol}`,
        amount: isEditingAmount ? displayValue : formatKeypadAmount(displayValue, '.', '', 2),
        isDisabled: isSubmitting || !isPositiveNumber(numericValue)
    };

    const keypad = isEditingAmount ? <TransactionKeypad keypad={handlers} dismissButton={<TransactionKeypadDismissButton />} /> : null;

    const handleConfirm = () => {
        if (!isPositiveNumber(numericValue)) {
            amountDisplayRef.current?.shake();

            return;
        }

        return run(
            Effect.gen(function* () {
                const transactionService = yield* TransactionService;

                yield* transactionService.updateById(
                    transactionId,
                    buildAdjustmentUpdateInput(transaction, details, numericValue, isIncrease)
                );
                markForEmbedding(transactionId);
                goBackOrReplace('/');
            }).pipe(toastOnFailure(t`Could not update transaction.`))
        );
    };

    return (
        <QuickFormLayout
            onDismissKeypad={dismissKeypad}
            amount={
                <TransactionAmountDisplay
                    ref={amountDisplayRef}
                    amount={display.amount}
                    currencySymbol={display.symbol}
                    variant={variant}
                    onPress={toggleKeypad}
                    isEditing={isEditingAmount}
                    accessibilityHint={amountAccessibilityHint}
                    testID={SimpleQuickFormSelector.AmountInput}
                />
            }
            context={
                <QuickFormSecondaryLine>
                    <AmountSignPill isIncrease={isIncrease} onToggle={toggleIsIncrease} />
                </QuickFormSecondaryLine>
            }
            keypad={keypad}
            actions={<TransactionFormActions label={t`Save`} isDisabled={display.isDisabled} onConfirm={handleConfirm} />}
        >
            <View className="pt-[12px]">
                <AdjustmentAccountSummary details={details} />
            </View>
        </QuickFormLayout>
    );
};
