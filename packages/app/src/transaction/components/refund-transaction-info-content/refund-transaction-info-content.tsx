import { TransactionEntryTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ScreenChromeFrame, ScreenChromeScrollView, useScreenChrome } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useRevertConsolidation } from '../../hook/use-revert-consolidation.hook';
import { useTransactionInfoHandoff } from '../../hook/use-transaction-info-handoff.hook';
import { useGetConsolidationSourcesQuery } from '../../query/use-get-consolidation-sources.query';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionEditHref } from '../../utils/get-transaction-edit-href.util';
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
    const { config } = useScreenChrome();
    const { revealOffset, onAmountLayout } = useTransactionInfoHandoff();
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
            <ScreenChromeScrollView contentInsetTop={config.headerHeight} contentInsetBottom={32} showsVerticalScrollIndicator={false}>
                <View className="px-3xl">
                    <RefundTransactionInfoHero
                        amount={amount}
                        title={t`Refund of ${merchant} · ${original}`}
                        operatedAt={transaction.operatedAt}
                        onAmountLayout={onAmountLayout}
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
            </ScreenChromeScrollView>
            <TransactionInfoNavBand />
            <TransactionInfoHeader
                transaction={transaction}
                editHref={getTransactionEditHref(parentTransaction)}
                revealOffset={revealOffset}
                onGoBack={router.back}
                compactTitle={t`Refund of ${merchant} · ${original}`}
                compactAmount={amount}
            />
        </ScreenChromeFrame>
    );
};
