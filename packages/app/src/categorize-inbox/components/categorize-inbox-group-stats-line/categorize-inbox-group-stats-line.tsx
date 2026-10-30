import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { getCategorizeInboxClusterTotal } from '../../utils/get-categorize-inbox-cluster-total.util';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupStatsLine = ({ cluster }: Props) => {
    const protectAmount = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const { amount, symbol, sign } = getCategorizeInboxClusterTotal(cluster, defaultInstrument.symbol);
    const averageLabel = `${sign}${protectAmount(amount / Math.max(1, cluster.rows.length), symbol)}`;

    return (
        <Text className="text-secondary-foreground text-[15px] tabular-nums" numberOfLines={1}>
            <Trans>Average payment</Trans>
            <Text className="text-primary font-medium">{` ${averageLabel}`}</Text>
        </Text>
    );
};
