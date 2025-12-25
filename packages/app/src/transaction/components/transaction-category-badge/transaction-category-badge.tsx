import {
    TransactionWithRelationsEntityInterface,
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly categoryLabel: string;
}

const wrapperClassName = 'rounded-sm py-xxs px-sm bg-secondary-background';
const textClassName = 'text-secondary-foreground/70 text-xxs font-medium';

export const TransactionCategoryBadge = ({ transaction, categoryLabel }: Props) => {
    const { decimalPlaces, defaultCurrency } = useSettingsContext();
    const format = useFormatMoney(decimalPlaces, defaultCurrency);
    const { t } = useLingui();

    const hasMultipleEntries = transaction.entries.length > 1;

    if (hasMultipleEntries) {
        return (
            <View className="flex-row flex-wrap gap-xs">
                {transaction.entries.map(entry => (
                    <View className="rounded-sm py-xxs px-sm bg-secondary-background" key={entry.id}>
                        <Text className={textClassName}>
                            {entry.category?.title ?? t`Unknown`} <Text className="text-primary/70">{format(entry.amount)}</Text>
                        </Text>
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View className="flex-row">
            <View className={wrapperClassName}>
                <Text className={textClassName}>{categoryLabel}</Text>
            </View>
        </View>
    );
};
