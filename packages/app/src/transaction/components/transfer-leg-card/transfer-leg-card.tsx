import { TransactionEntryWithRelationsEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';

export interface TransferLegInterface {
    fromEntry: TransactionEntryWithRelationsEntityInterface;
    toEntry: TransactionEntryWithRelationsEntityInterface;
}

interface Props {
    readonly leg: TransferLegInterface;
    readonly isLast: boolean;
    readonly formatDigits: (amount: number, symbol: string) => string;
}

export const TransferLegCard = ({ leg, isLast, formatDigits }: Props) => {
    const { fromEntry, toEntry } = leg;
    const fromAccount = fromEntry.account;
    const toAccount = toEntry.account;

    const fromAmount = formatDigits(convertFromMicroUnits(Math.abs(fromEntry.amount)), fromAccount.instrument.symbol);
    const toAmount = formatDigits(convertFromMicroUnits(toEntry.amount), toAccount.instrument.symbol);

    const containerClassName = isLast ? '' : 'mb-md';

    return (
        <View className={containerClassName}>
            <Card>
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 items-center">
                        <Text className="text-xxs text-secondary-foreground font-semibold mb-xs">{t`FROM`}</Text>
                        <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                            {fromAccount.title}
                        </Text>
                        <Text className="text-xs text-destructive-foreground font-medium">-{fromAmount}</Text>
                    </View>

                    <View className="mx-md">
                        <CircleIcon size={28} iconSize={12} variant="ghost" icon={UserIconNameEnum.ArrowRight} />
                    </View>

                    <View className="flex-1 items-center">
                        <Text className="text-xxs text-secondary-foreground font-semibold mb-xs">{t`TO`}</Text>
                        <Text className="text-sm font-medium text-primary" numberOfLines={1}>
                            {toAccount.title}
                        </Text>
                        <Text className="text-xs text-positive-foreground font-medium">+{toAmount}</Text>
                    </View>
                </View>
            </Card>
        </View>
    );
};
