import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

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

    const total = getCategorizeInboxClusterTotal(cluster, defaultInstrument.symbol);

    if (!isDefined(total)) {
        return null;
    }

    const averageLabel = `${total.sign}${protectAmount(total.amount / Math.max(1, cluster.rows.length), total.symbol)}`;

    return (
        <Text className="text-secondary-foreground text-center text-[15px] leading-[20px] tabular-nums">
            <Trans>Average payment</Trans>
            <Text className="text-primary font-medium">{` ${averageLabel}`}</Text>
        </Text>
    );
};
