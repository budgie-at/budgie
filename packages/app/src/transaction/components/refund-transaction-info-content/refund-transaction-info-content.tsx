import { TransactionEntryTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ScreenChromeFrame, ScreenChromeScrollView, useScreenChrome } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useGetConsolidationSourcesQuery } from '../../query/use-get-consolidation-sources.query';
import { formatTransactionInfoAmount } from '../../utils/format-transaction-info-amount.util';
import { getTransactionDisplayTitle } from '../../utils/get-transaction-display-title.util';
import { getTransactionHref } from '../../utils/get-transaction-href.util';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';
import { RefundTransactionInfoHero } from '../refund-transaction-info-hero/refund-transaction-info-hero';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoHeader } from '../transaction-info-header/transaction-info-header';
import { TransactionInfoNavBand } from '../transaction-info-nav-band/transaction-info-nav-band';
import { TransactionInfoNoteGroup } from '../transaction-info-note-group/transaction-info-note-group';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly parentTransaction: TransactionWithRelationsEntityInterface;
}

const HERO_TITLE_DEFAULT_OFFSET = 64;

export const RefundTransactionInfoContent = ({ transaction, parentTransaction }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const formatDigits = useProtectedAmountLabel();
    const { config } = useScreenChrome();
    const [revealOffset, setRevealOffset] = useState(HERO_TITLE_DEFAULT_OFFSET);
    const { sources } = useGetConsolidationSourcesQuery(parentTransaction.id);
    const source = sources.find(row => row.sourceTransactionId === transaction.id);
    const original = formatTransactionInfoAmount(parentTransaction, formatDigits);
    const merchant = getTransactionDisplayTitle(parentTransaction);
    const handleOpenPurchase = () => void router.push(getTransactionHref(parentTransaction));
    const handleAmountLayout = (event: LayoutChangeEvent) => void setRevealOffset(Math.max(0, event.nativeEvent.layout.y - 48));

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
                        revealOffset={revealOffset}
                        onAmountLayout={handleAmountLayout}
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
                    </View>
                </View>
            </ScreenChromeScrollView>
            <TransactionInfoNavBand />
            <TransactionInfoHeader
                transaction={transaction}
                editHref={null}
                revealOffset={revealOffset}
                onGoBack={router.back}
                compactTitle={t`Refund`}
                compactAmount={amount}
            />
        </ScreenChromeFrame>
    );
};
