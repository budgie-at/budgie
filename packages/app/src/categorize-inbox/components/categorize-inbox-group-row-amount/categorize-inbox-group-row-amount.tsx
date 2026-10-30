import { TransactionTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { cn } from '../../../@generic/utils/cn.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'rows' | 'totalBaseAmount'>;
}

export const CategorizeInboxGroupRowAmount = ({ cluster }: Props) => {
    const amountLabel = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const [firstRow] = cluster.rows;
    const isSingleRow = cluster.rows.length === 1;
    const amount = isSingleRow ? firstRow.amount : cluster.totalBaseAmount;
    const symbol = isSingleRow ? firstRow.instrumentSymbol : defaultInstrument.symbol;
    const isIncome = firstRow.type === TransactionTypeEnum.INCOME;

    if (!isDefined(amount)) {
        return null;
    }

    const sign = isIncome ? '+' : '';
    const colorClassName = isIncome ? 'text-positive-foreground' : 'text-primary';

    return (
        <Text className={cn('shrink-0 text-[15px] leading-[18px] font-semibold tabular-nums', colorClassName)} numberOfLines={1}>
            {`${sign}${amountLabel(amount, symbol)}`}
        </Text>
    );
};
