import { UserIconNameEnum } from '@budgie/contracts';
import { TransactionTransferService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { ScrollableSheetCard } from '../../../@generic/component/scrollable-sheet-card/scrollable-sheet-card';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { DepositCloseSelector } from '../../../app/deposit-close.selector';
import { useDepositClosePrefillQuery } from '../../query/use-deposit-close-prefill.query';
import { useGetAccountByIdQuery } from '../../query/use-get-account-by-id.query';
import { getDepositCloseDelta } from '../../utils/get-deposit-close-delta.util';
import { DepositCloseDeltaLine } from '../deposit-close-delta-line/deposit-close-delta-line';
import { DepositCloseLinkPayoutsButton } from '../deposit-close-link-payouts-button/deposit-close-link-payouts-button';

interface Props {
    readonly depositAccountId: number;
    readonly destinationAccountId: number;
}

export const DepositCloseSheetContent = ({ depositAccountId, destinationAccountId }: Props) => {
    const { t } = useLingui();
    const { run, isLoading } = useSingleFlight();
    const { account: deposit } = useGetAccountByIdQuery(depositAccountId);
    const { account: destination } = useGetAccountByIdQuery(destinationAccountId);
    const { prefill, isLoading: isPrefillLoading } = useDepositClosePrefillQuery(depositAccountId);
    const [enteredAmount, setEnteredAmount] = useState<number | null>(null);
    const amountReceived = enteredAmount ?? prefill?.amountReceived ?? 0;
    const delta = getDepositCloseDelta(amountReceived, prefill?.ledgerBalance ?? 0);
    const instrumentSymbol = deposit?.instrument.symbol ?? '';
    const destinationTitle = destination?.title ?? '';

    const handleClose = () => {
        void run(
            Effect.flatMap(TransactionTransferService, service =>
                service.closeDepositTo(depositAccountId, destinationAccountId, amountReceived)
            ).pipe(Effect.andThen(Effect.sync(() => void dismissAllOrReplace('/'))), toastOnFailure(t`Could not close deposit`))
        );
    };

    const handleLinked = () => {
        setEnteredAmount(null);
    };

    return (
        <ScrollableSheetCard
            header={
                <View className="px-xl">
                    <SheetTitleRow title={t`Close Deposit`} />
                </View>
            }
            ratio={MORPHING_SHEET_SELECTOR_HEIGHT_RATIO}
            contentClassName="px-5xl pt-md gap-y-3xl pb-3xl"
            testID={DepositCloseSelector.Sheet}
            footer={
                <View className="px-5xl pb-3xl">
                    <Button
                        content={t`Close Deposit`}
                        size="lg"
                        isLoading={isLoading}
                        disabled={isPrefillLoading}
                        onPress={handleClose}
                        testID={DepositCloseSelector.ConfirmButton}
                    />
                </View>
            }
        >
            <GroupedListSection>
                <GroupedListValueRow
                    icon={UserIconNameEnum.Landmark}
                    title={t`Transfer to`}
                    value={destinationTitle}
                    testID={DepositCloseSelector.Destination}
                />
            </GroupedListSection>
            <FormItem label={t`Amount received`}>
                <LoadingContent isLoading={isPrefillLoading}>
                    <FormAmountInput
                        testID={DepositCloseSelector.AmountInput}
                        value={amountReceived}
                        instrumentSymbol={instrumentSymbol}
                        minimumDecimalPlaces={2}
                        onChange={setEnteredAmount}
                    />
                </LoadingContent>
            </FormItem>
            <DepositCloseDeltaLine delta={delta} instrumentSymbol={instrumentSymbol} />
            <DepositCloseLinkPayoutsButton depositAccountId={depositAccountId} onLinked={handleLinked} />
        </ScrollableSheetCard>
    );
};
