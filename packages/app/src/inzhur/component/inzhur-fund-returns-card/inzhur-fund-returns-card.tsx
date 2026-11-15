import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { YieldEntryRow } from '../../../yield/component/yield-entry-row/yield-entry-row';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurFundCostReturnQuery } from '../../query/use-inzhur-gain.query';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurMoneyRow } from '../inzhur-money-row/inzhur-money-row';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id'>;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const InzhurFundReturnsCard = ({ account }: Props) => {
    const { t } = useLingui();
    const costReturn = useInzhurFundCostReturnQuery(account.id);
    const formatAmount = useProtectedAmountLabel();
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';

    if (!isDefined(costReturn)) {
        return null;
    }

    const netLabel = formatAmount(costReturn.dividends - costReturn.tax, symbol);

    const captionSegments = [t`Gross, ${netLabel} after tax`];
    const yieldScope = { positionAccountId: account.id, instrumentId: null };

    return (
        <View className="self-stretch rounded-3xl bg-surface-row" style={CONTINUOUS_CORNERS} testID={InzhurSelector.FundReturns}>
            <InzhurMoneyRow
                label={t`Dividends`}
                captionSegments={captionSegments}
                amount={costReturn.dividends}
                instrumentSymbol={symbol}
                icon={UserIconNameEnum.RefreshCw}
            />
            <YieldEntryRow scope={yieldScope} />
        </View>
    );
};
