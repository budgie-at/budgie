import { TagEntityInterface, TransactionFilterInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { TagStatisticsCard } from '../tag-statistics-card/tag-statistics-card';

interface Props {
    readonly title: string;
    readonly totalAmount: number;
    readonly variant: ColorPaletteVariant;
    readonly stats: { amount: number; tag: TagEntityInterface | null }[];
    readonly filters: TransactionFilterInterface;
    readonly isIncome: boolean;
}

export const StatsByTags = ({ title, stats, totalAmount, variant, filters, isIncome }: Props) => {
    const { t } = useLingui();

    const renderStat = ({ tag, amount }: { tag: TagEntityInterface | null; amount: number }) => {
        const microAmount = convertFromMicroUnits(amount);
        const percentage = Number((totalAmount > 0 ? (microAmount / totalAmount) * 100 : 0).toFixed(2));

        const tagData = tag ?? { id: null, title: t`Untagged` };

        return (
            <TagStatisticsCard
                key={tagData.id ?? 'untagged'}
                tag={tagData}
                amount={amount}
                percentage={percentage}
                variant={variant}
                filters={filters}
                isIncome={isIncome}
            />
        );
    };

    /* jscpd:ignore-start */
    return (
        <View className="gap-y-md">
            <Text className="uppercase text-secondary-foreground text-xs">{title}</Text>

            <Card className="gap-y-xl">{stats.map(renderStat)}</Card>
        </View>
    );
    /* jscpd:ignore-end */
};
