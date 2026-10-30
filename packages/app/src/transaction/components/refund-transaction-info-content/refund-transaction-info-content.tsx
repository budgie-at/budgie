import { TransactionEntryTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useTransactionInfoHandoff } from '../../hook/use-transaction-info-handoff.hook';
import { useGetConsolidationSourcesQuery } from '../../query/use-get-consolidation-sources.query';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { RefundTransactionInfoHero } from '../refund-transaction-info-hero/refund-transaction-info-hero';
import { TransactionInfoDeleteRow } from '../transaction-info-delete-row/transaction-info-delete-row';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoHeader } from '../transaction-info-header/transaction-info-header';
import { TransactionInfoNavBand } from '../transaction-info-nav-band/transaction-info-nav-band';
import { TransactionInfoNoteGroup } from '../transaction-info-note-group/transaction-info-note-group';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';
import { TransactionInfoScrollView } from '../transaction-info-scroll-view/transaction-info-scroll-view';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly parentTransaction: TransactionWithRelationsEntityInterface;
}

export const RefundTransactionInfoContent = ({ transaction, parentTransaction }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const removeRefund = useRevertConsolidation(parentTransaction.id, router.back);
    const formatDigits = useProtectedAmountLabel();
    const { minimumHeight, revealOffset, onEndLayout, onAmountLayout, onContentLayout, scrollRef, handleScrollEnd } =
        useTransactionInfoHandoff();
    const { sources } = useGetConsolidationSourcesQuery(parentTransaction.id);
    const source = sources.find(row => row.sourceTransactionId === transaction.id);
    const original = formatTransactionInfoAmount(parentTransaction, formatDigits);
    const merchant = getTransactionDisplayTitle(parentTransaction);
    const handleOpenPurchase = () => void router.push(getTransactionHref(parentTransaction));

    if (!isDefined(source)) {
        return null;
    }

    const amount = `+${formatDigits(convertFromMicroUnits(sumEntryAmounts(sources.filter(row => row.sourceTransactionId === transaction.id && row.entryType === TransactionEntryTypeEnum.DEBIT))), source.currencySymbol)}`;

    return (
        <ScreenChromeFrame testID={TransactionInfoPageSelector.Page}>
            <TransactionInfoScrollView scrollRef={scrollRef} onScrollEnd={handleScrollEnd} minimumHeight={minimumHeight}>
                <View className="px-3xl" onLayout={onContentLayout}>
                    <RefundTransactionInfoHero
                        amount={amount}
                        title={t`Refund from ${merchant}`}
                        operatedAt={transaction.operatedAt}
                        onAmountLayout={onAmountLayout}
                        onEndLayout={onEndLayout}
                    />
                    <View className="gap-y-5xl">
                        <TransactionInfoGroup>
                            <TransactionInfoRow
                                icon={UserIconNameEnum.Wallet}
                                label={t`Account`}
                                value={source.accountTitle}
                                testID={TransactionInfoPageSelector.Row.Account}
                            />
                            <TransactionInfoRow
                                icon={UserIconNameEnum.Receipt}
                                label={t`Original purchase`}
                                value={`${merchant} · ${original}`}
                                onPress={handleOpenPurchase}
                                testID={TransactionInfoPageSelector.Row.RefundSummary}
                            />
                        </TransactionInfoGroup>
                        <TransactionInfoNoteGroup transaction={transaction} />
                        <TransactionInfoDeleteRow transaction={transaction} onDelete={removeRefund} />
                    </View>
                </View>
            </TransactionInfoScrollView>
            <TransactionInfoNavBand />
            <TransactionInfoHeader
                transaction={transaction}
                editHref={null}
                revealOffset={revealOffset}
                onGoBack={router.back}
                compactTitle={t`Refund from ${merchant}`}
                compactAmount={amount}
            />
        </ScreenChromeFrame>
    );
};
