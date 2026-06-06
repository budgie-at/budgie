import {
    TransactionAssociationEnum,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionUpdateServiceInputInterface,
    TransactionWithRelationsEntityInterface,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';
import { View } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { useKeypadInput } from '../../hook/use-keypad-input.hook';
import { transactionService } from '../../service/transaction.service';
import { AdjustmentAccountSummary } from '../adjustment-account-summary/adjustment-account-summary';
import { AdjustmentSignToggle } from '../adjustment-sign-toggle/adjustment-sign-toggle';
import { TransactionAmountDisplay, TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
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
    const details = getAdjustmentDetails(transaction);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isIncrease, setIsIncrease] = useState(details?.initialIsIncrease ?? true);
    const { displayValue, numericValue, handlers } = useKeypadInput({ initialValue: details?.initialAmount ?? 0 });

    if (!isDefined(details)) {
        return null;
    }

    const variant: ColorPaletteVariant = isIncrease ? 'positive' : 'destructive';
    const signedInstrumentSymbol = `${isIncrease ? '+' : '-'}${details.instrumentSymbol}`;
    const confirmDisabled = isSubmitting || !isPositiveNumber(numericValue);

    const handleGoBack = () => void goBackOrReplace('/');

    const handleConfirm = async () => {
        if (!isPositiveNumber(numericValue)) {
            amountDisplayRef.current?.shake();

            return;
        }

        try {
            setIsSubmitting(true);
            await transactionService.updateById(transactionId, buildAdjustmentUpdateInput(transaction, details, numericValue, isIncrease));
            void markForEmbedding(transactionId);
            goBackOrReplace('/');
        } catch (error: unknown) {
            Toast.show({
                type: 'error',
                text1: t`Could not update transaction.`,
                text2: getErrorMessage(error)
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View className="flex-1 gap-xl">
            <TransactionAmountDisplay
                ref={amountDisplayRef}
                amount={displayValue}
                currencySymbol={signedInstrumentSymbol}
                variant={variant}
                label={details.instrumentCode}
            />

            <View className="gap-md">
                <AdjustmentSignToggle isIncrease={isIncrease} onChange={setIsIncrease} />
                <AdjustmentAccountSummary details={details} variant={variant} />
            </View>

            <TransactionKeypad
                variant={variant}
                onDigit={handlers.onDigit}
                onDecimal={handlers.onDecimal}
                onBackspace={handlers.onBackspace}
                onLongBackspace={handlers.onLongBackspace}
                onConfirm={handleConfirm}
                onCancel={handleGoBack}
                isConfirmDisabled={confirmDisabled}
            />
        </View>
    );
};
