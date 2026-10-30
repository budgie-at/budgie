import { TransactionTypeEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { CategorizeInboxAmount } from '../categorize-inbox-amount/categorize-inbox-amount';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';

interface Props {
    readonly row: CategorizeInboxRowInterface;
}

export const CategorizeInboxRecentPaymentRow = ({ row }: Props) => {
    const { formatWeekdayAndDay, formatTime } = useFormatDate();

    return (
        <View className="min-h-[60px] flex-row items-center gap-x-xl px-3xl py-xl" accessible>
            <View className="absolute top-0 right-0 left-[64px] h-hairline bg-surface-separator" pointerEvents="none" />
            <View className="size-[36px] items-center justify-center rounded-full bg-secondary-foreground/15">
                <Text className="text-primary text-[15px] font-semibold tabular-nums">{row.operatedAt.getDate()}</Text>
            </View>
            <Text className="text-primary min-w-0 flex-1 text-[17px] tabular-nums" numberOfLines={1}>
                {formatWeekdayAndDay(row.operatedAt)}
                <Text className="text-secondary-foreground">{` · ${formatTime(row.operatedAt)}`}</Text>
            </Text>
            <CategorizeInboxAmount
                amount={row.amount}
                symbol={row.instrumentSymbol}
                isIncome={row.type === TransactionTypeEnum.INCOME}
                className="text-[17px]"
            />
        </View>
    );
};
