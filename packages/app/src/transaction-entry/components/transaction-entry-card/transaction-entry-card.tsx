import { TransactionEntryTypeEnum, TransactionEntryWithRelationsEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly entry: TransactionEntryWithRelationsEntityInterface;
}

const iconVariant: Record<TransactionTypeEnum, ColorPaletteVariant> = {
    [TransactionTypeEnum.DEBT]: 'warning',
    [TransactionTypeEnum.INCOME]: 'positive',
    [TransactionTypeEnum.TRANSFER]: 'default',
    [TransactionTypeEnum.EXPENSE]: 'destructive'
};

const amountVariants = cva('text-md', {
    variants: {
        type: {
            [TransactionEntryTypeEnum.DEBIT]: 'text-positive-foreground',
            [TransactionEntryTypeEnum.CREDIT]: 'text-destructive-foreground'
        }
    }
});

export const TransactionEntryCard = ({ entry }: Props) => {
    const { decimalPlaces, defaultCurrency } = useSettingsContext();
    const formatMoney = useFormatMoney(decimalPlaces, defaultCurrency, true);
    const { formatMonthAndDay } = useFormatDate();

    return (
        <Card className="flex-row items-center gap-x-xl p-xl">
            <CircleIcon size="md" icon={ICONS[entry.category.icon]} variant={iconVariant[entry.transaction.type]} />

            <View className="flex-1">
                <Text className="text-primary text-sm mb-xxs">{entry.transaction.title}</Text>

                <View className="flex-row items-center gap-x-sm mb-md">
                    <Text className="text-xs text-secondary-foreground">{formatMonthAndDay(entry.transaction.operatedAt)}</Text>
                    <Text className="text-xs font-medium text-primary py-xxs px-md rounded-2xl border border-secondary-corner">
                        {entry.account.title}
                    </Text>
                </View>

                <Text className="bg-secondary-background self-start text-xs font-medium text-primary py-xxs px-md rounded-2xl">
                    {entry.category.title}
                </Text>
            </View>

            <Text className={amountVariants({ type: entry.type })}>{formatMoney(entry.amount)}</Text>
        </Card>
    );
};
