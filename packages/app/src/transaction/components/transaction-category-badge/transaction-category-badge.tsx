import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly categoryLabel: string;
}

const wrapperClassName = 'rounded-sm py-xxs px-sm bg-secondary-background';
const textClassName = 'text-secondary-foreground/70 text-xxs font-medium';

const getEntryLabel = (entry: TransactionWithRelationsEntityInterface['entries'][0], unknownLabel: string): string => {
    if (isDefined(entry.category?.title)) {
        return entry.category.title;
    }

    if (isDefined(entry.mccCategory?.shortDescription)) {
        return entry.mccCategory.shortDescription;
    }

    return unknownLabel;
};

export const TransactionCategoryBadge = ({ transaction, categoryLabel }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { t } = useLingui();

    const hasMultipleEntries = transaction.entries.length > 1;
    const unknownLabel = t`Unknown`;

    if (hasMultipleEntries) {
        return (
            <View className="flex-row flex-wrap gap-xs">
                {transaction.entries.map(entry => (
                    <View className="rounded-sm py-xxs px-sm bg-secondary-background" key={entry.id}>
                        <Text className={textClassName}>
                            {getEntryLabel(entry, unknownLabel)}{' '}
                            <Text className="text-primary/70">{formatDigits(entry.amount, defaultInstrument.symbol)}</Text>
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
