import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
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
    const formatAmount = useFormatDigits(2);
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';

    if (!isDefined(costReturn)) {
        return null;
    }

    const netLabel = formatAmount(costReturn.dividends - costReturn.tax, symbol);

    const captionSegments = [t`Gross, ${netLabel} after tax`];

    return (
        <View
            className="gap-y-lg self-stretch rounded-3xl bg-surface-row px-3xl py-[12px]"
            style={CONTINUOUS_CORNERS}
            testID={InzhurSelector.FundReturns}
        >
            <InzhurMoneyRow
                label={t`Dividends`}
                captionSegments={captionSegments}
                amount={costReturn.dividends}
                instrumentSymbol={symbol}
                icon={UserIconNameEnum.RefreshCw}
            />
        </View>
    );
};
