import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { useHryvniaInstrumentQuery } from '../../query/use-hryvnia-instrument.query';
import { useInzhurFundReturnsQuery } from '../../query/use-inzhur-fund-returns.query';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'instrumentId'>;
    readonly balance: number;
}

export const InzhurFundHoldingLine = ({ account, balance }: Props) => {
    const { t } = useLingui();
    const { latestPrice } = useInzhurFundReturnsQuery(account.id, account.instrumentId);
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const formatAmount = useFormatDigits(2);
    const formatFundQuantity = useFormatFundQuantity();

    const quantityLabel = formatFundQuantity(balance);
    const priceLabel = isDefined(latestPrice) ? formatAmount(latestPrice.price, symbol) : null;
    const label = isDefined(priceLabel) ? t`${quantityLabel} · ${priceLabel} each` : quantityLabel;

    return <ProtectedText className="text-center text-[15px] leading-[20px] text-secondary-foreground tabular-nums">{label}</ProtectedText>;
};
