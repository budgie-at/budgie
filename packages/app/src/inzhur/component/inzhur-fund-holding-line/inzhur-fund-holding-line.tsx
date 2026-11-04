import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
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
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const { latestPrice } = useInzhurFundReturnsQuery(account.id, account.instrumentId);
    const symbol = useHryvniaInstrumentQuery()?.symbol ?? '';
    const formatAmount = useFormatDigits(2);
    const formatFundQuantity = useFormatFundQuantity();

    const quantityLabel = formatFundQuantity(balance);
    const priceLabel = isDefined(latestPrice) ? formatAmount(latestPrice.price, symbol) : null;
    const priceDate = isDefined(latestPrice) ? formatMonthAndDayAndOptionalYear(latestPrice.priceDate) : null;

    return (
        <View className="items-center gap-y-xxs px-5xl">
            <ProtectedText className="text-center text-[15px] leading-[20px] text-secondary-foreground tabular-nums">
                {quantityLabel}
            </ProtectedText>
            {isDefined(priceLabel) ? (
                <Text className="text-center text-[15px] leading-[20px] text-secondary-foreground tabular-nums">
                    {t`${priceLabel} per certificate`}
                </Text>
            ) : null}
            {isDefined(priceDate) ? (
                <Text className="text-center text-[13px] leading-[18px] text-secondary-foreground tabular-nums">
                    {t`Price as of ${priceDate}`}
                </Text>
            ) : null}
        </View>
    );
};
