import { TransactionTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Plural, Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxGroupStatsLine = ({ cluster }: Props) => {
    const protectAmount = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const count = cluster.rows.length;
    const hasBaseTotal = isDefined(cluster.totalBaseAmount);
    const fallbackTotal = cluster.rows.reduce((sum, row) => sum + row.amount, 0);
    const total = cluster.totalBaseAmount ?? fallbackTotal;
    const symbol = hasBaseTotal ? defaultInstrument.symbol : (cluster.rows.at(0)?.instrumentSymbol ?? '');
    const sign = cluster.rows.at(0)?.type === TransactionTypeEnum.INCOME ? '+' : '';
    const totalLabel = `${sign}${protectAmount(total, symbol)}`;
    const averageLabel = `${sign}${protectAmount(total / Math.max(1, count), symbol)}`;

    return (
        <Text className="text-primary text-sm tabular-nums" numberOfLines={1}>
            <Plural value={count} one="# payment" other="# payments" />
            <Text className="text-secondary-foreground">{' · '}</Text>
            {totalLabel}
            <Text className="text-secondary-foreground">{' · '}</Text>
            <Text className="text-secondary-foreground">
                <Trans>avg</Trans>
            </Text>
            {` ${averageLabel}`}
        </Text>
    );
};
