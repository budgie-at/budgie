import { convertFromMicroUnits } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetTransactionByIdQuery } from '../../../transaction/query/use-get-transaction-by-id.query';
import { getTransactionDisplayTitle } from '../../../transaction/utils/get-transaction-display-title.util';
import { getTransactionInfoPrimaryEntry } from '../../../transaction/utils/get-transaction-info-primary-entry.util';
import { sumEntryAmounts } from '../../../transaction/utils/sum-entry-amounts.util';
import { RecurringMerchantTile } from '../recurring-merchant-tile/recurring-merchant-tile';

interface Props {
    readonly transactionId: number;
}

const continuousCorners = { borderCurve: 'continuous' as const };

export const MakeRecurringSourceRow = ({ transactionId }: Props) => {
    const { transaction } = useGetTransactionByIdQuery(transactionId);
    const protectAmount = useProtectedAmountLabel();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const primaryEntry = isDefined(transaction) ? getTransactionInfoPrimaryEntry(transaction) : null;

    if (!isDefined(transaction) || !isDefined(primaryEntry)) {
        return null;
    }

    const title = getTransactionDisplayTitle(transaction);
    const amountInMicroUnits = sumEntryAmounts(
        getTransactionCategoryEntries(transaction.entries).filter(entry => entry.accountId === primaryEntry.accountId)
    );
    const amount = protectAmount(Math.abs(convertFromMicroUnits(amountInMicroUnits)), primaryEntry.account.instrument.symbol);
    const subtitle = `${formatMonthAndDayAndOptionalYear(transaction.operatedAt)} · ${primaryEntry.account.title}`;
    const categoryIcon = primaryEntry.category?.icon ?? null;

    return (
        <View className="flex-row items-center gap-x-xl rounded-3xl bg-sheet-grouped-row px-3xl py-xl" style={continuousCorners}>
            <RecurringMerchantTile categoryId={primaryEntry.categoryId} categoryIcon={categoryIcon} title={title} size={40} />
            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text dynamicTypeRamp="headline" className="text-[16px] font-semibold text-primary" numberOfLines={1}>
                    {title}
                </Text>
                <Text dynamicTypeRamp="footnote" className="text-[13px] text-secondary-foreground" numberOfLines={1}>
                    {subtitle}
                </Text>
            </View>
            <Text dynamicTypeRamp="headline" className="shrink-0 text-[16px] font-semibold text-primary tabular-nums">
                {amount}
            </Text>
        </View>
    );
};
