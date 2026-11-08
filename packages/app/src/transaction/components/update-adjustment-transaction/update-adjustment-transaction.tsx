import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { TransactionService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRef } from 'react';
import { FormProvider } from 'react-hook-form';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useEmbeddingGenerator } from '../../../ai/hook/use-embedding-generator.hook';
import { useAdjustmentInput } from '../../hook/use-adjustment-input.hook';
import { useTransactionKeypadEditing } from '../../hook/use-transaction-keypad-editing.hook';
import { buildAdjustmentUpdateInput } from '../../utils/build-adjustment-update-input.util';
import { getAdjustmentDetails } from '../../utils/get-adjustment-details.util';
import { AdjustmentAccountSummary } from '../adjustment-account-summary/adjustment-account-summary';
import { AdjustmentAmountDisplay } from '../adjustment-amount-display/adjustment-amount-display';
import { AdjustmentBalancePreview } from '../adjustment-balance-preview/adjustment-balance-preview';
import { AdjustmentDirection } from '../adjustment-direction/adjustment-direction';
import { QuickFormLayout } from '../quick-form-layout/quick-form-layout';
import { QuickFormSecondaryLine } from '../quick-form-secondary-line/quick-form-secondary-line';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionAmountDisplayRef } from '../transaction-amount-display/transaction-amount-display';
import { TransactionFormActions } from '../transaction-form-actions/transaction-form-actions';
import { TransactionKeypadDismissButton } from '../transaction-keypad-dismiss-button/transaction-keypad-dismiss-button';
import { TransactionKeypad } from '../transaction-keypad/transaction-keypad';

import type { SyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionId: number;
    readonly sync: SyncEntityInterface | null;
}

export const UpdateAdjustmentTransaction = ({ transaction, transactionId, sync }: Props) => {
    const { t } = useLingui();
    const { markForEmbedding } = useEmbeddingGenerator();
    const amountDisplayRef = useRef<TransactionAmountDisplayRef | null>(null);
    const editing = useTransactionKeypadEditing(false);
    const details = getAdjustmentDetails(transaction, sync);
    const { isLoading: isSubmitting, run } = useSingleFlight();
    const input = useAdjustmentInput(details?.initialAmount ?? 0, details?.initialIsIncrease ?? true, transaction.comment);

    if (!isDefined(details)) {
        return null;
    }

    const isDisabled = isSubmitting || !isPositiveNumber(input.numericValue) || input.isUnchanged;
    const keypad = editing.isEditingAmount ? (
        <TransactionKeypad keypad={input.handlers} dismissButton={<TransactionKeypadDismissButton />} />
    ) : null;

    const handleConfirm = () => {
        if (isDisabled) {
            amountDisplayRef.current?.shake();

            return;
        }

        return run(
            Effect.gen(function* () {
                const transactionService = yield* TransactionService;

                yield* transactionService.updateById(
                    transactionId,
                    buildAdjustmentUpdateInput({ ...transaction, comment: input.comment }, details, input.numericValue, input.isIncrease)
                );
                markForEmbedding(transactionId);
                goBackOrReplace('/');
            }).pipe(toastOnFailure(t`Could not update transaction.`))
        );
    };

    return (
        <FormProvider {...input.form}>
            <QuickFormLayout
                onDismissKeypad={editing.dismissKeypad}
                amount={<AdjustmentAmountDisplay ref={amountDisplayRef} details={details} input={input} editing={editing} />}
                context={
                    <View className="gap-y-[4px]">
                        <QuickFormSecondaryLine>
                            <AdjustmentBalancePreview details={details} amount={input.numericValue} isIncrease={input.isIncrease} />
                        </QuickFormSecondaryLine>
                        <AdjustmentDirection details={details} isIncrease={input.isIncrease} onToggle={input.toggleIsIncrease} />
                    </View>
                }
                keypad={keypad}
                actions={
                    <TransactionFormActions
                        label={t`Save`}
                        isDisabled={isDisabled}
                        onConfirm={handleConfirm}
                        testID={SimpleQuickFormSelector.SubmitButton}
                    />
                }
            >
                <AdjustmentAccountSummary details={details} amount={input.numericValue} isIncrease={input.isIncrease} />
            </QuickFormLayout>
        </FormProvider>
    );
};
