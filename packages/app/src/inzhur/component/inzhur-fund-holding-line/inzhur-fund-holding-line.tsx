import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { joinWithMiddot } from '../../../@generic/utils/join-with-middot.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { inzhurChartScrubAtom } from '../../constant/inzhur-chart-scrub-atom.constant';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurFundLatestPriceQuery } from '../../query/use-inzhur-fund-returns.query';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'instrumentId'>;
    readonly balance: number;
}

const UNIT_PRICE_DECIMALS = 3;

export const InzhurFundHoldingLine = ({ account, balance }: Props) => {
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const latestPrice = useInzhurFundLatestPriceQuery(account.instrumentId);
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const formatAmount = useFormatDigits(UNIT_PRICE_DECIMALS, UNIT_PRICE_DECIMALS);
    const formatFundQuantity = useFormatFundQuantity();
    const scrubbedPoint = useAtomValue(inzhurChartScrubAtom);
    const { t } = useLingui();

    const shownPrice = scrubbedPoint ?? (isDefined(latestPrice) ? { value: latestPrice.price, date: latestPrice.priceDate } : null);
    const unitPrice = isDefined(shownPrice) ? formatAmount(shownPrice.value, symbol) : null;
    const priceLabel = isDefined(unitPrice) ? t`${unitPrice} each` : null;
    const priceDate = isDefined(shownPrice) ? formatMonthAndDayAndOptionalYear(parseISO(shownPrice.date)) : null;

    return (
        <ProtectedText className="px-5xl text-center text-[15px] leading-[20px] text-secondary-foreground tabular-nums">
            {joinWithMiddot([formatFundQuantity(balance), priceLabel, priceDate])}
        </ProtectedText>
    );
};
