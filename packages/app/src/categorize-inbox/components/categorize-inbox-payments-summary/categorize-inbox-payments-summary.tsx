import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useCategorizeInboxIncludedTotal } from '../../hook/use-categorize-inbox-included-total.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxPaymentsSummary = ({ cluster }: Props) => {
    const { count, totalLabel } = useCategorizeInboxIncludedTotal(cluster);

    const rowCount = cluster.rows.length;
    const totalNode = isDefined(totalLabel) ? (
        <Text
            className="text-primary text-[40px] leading-[48px] font-semibold tracking-[-1px] tabular-nums"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
        >
            {totalLabel}
        </Text>
    ) : null;

    return (
        <View className="items-center gap-y-sm px-3xl pb-xs pt-md">
            {totalNode}
            <Text className="text-secondary-foreground text-center text-[15px] leading-[20px] tabular-nums" numberOfLines={1}>
                <Trans>
                    {count} of {rowCount} selected
                </Trans>
            </Text>
        </View>
    );
};
