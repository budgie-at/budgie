import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ProtectedMoney } from '../../../@generic/component/protected-money/protected-money';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { DepositDetailsRow } from '../deposit-details-row/deposit-details-row';

import { DepositDetailsCardSelector } from './deposit-details-card.selector';

interface Props {
    readonly balance: number;
    readonly instrumentSymbol: string;
    readonly interestRate: number | null;
    readonly deadline: Date | null;
}

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
const DAYS_PER_YEAR = 365;
const PERCENT_DIVISOR = 100;
const RATE_DECIMAL_PLACES = 2;

const containerVariants = cva('p-5xl border gap-y-lg rounded-3xl mt-md', {
    variants: { variant: BACKGROUND_COLOR_PALETTE }
});

const computeDaysRemaining = (deadline: Date): number => Math.max(Math.ceil((deadline.getTime() - Date.now()) / MILLISECONDS_PER_DAY), 0);

export const DepositDetailsCard = ({ balance, instrumentSymbol, interestRate, deadline }: Props) => {
    const { formatDayAndFullMonthAndYear } = useFormatDate();
    const formatRateDigits = useFormatDigits(0, RATE_DECIMAL_PLACES);
    const formatCountDigits = useFormatDigits(0);

    if (!isDefined(interestRate) && !isDefined(deadline)) {
        return null;
    }

    const daysRemaining = isDefined(deadline) ? computeDaysRemaining(deadline) : null;
    const expectedPayout =
        isDefined(interestRate) && isDefined(daysRemaining)
            ? balance + balance * (interestRate / PERCENT_DIVISOR) * (daysRemaining / DAYS_PER_YEAR)
            : null;

    return (
        <View className={containerVariants({ variant: 'secondary' })} testID={DepositDetailsCardSelector.Container}>
            {isDefined(interestRate) ? (
                <DepositDetailsRow
                    testID={DepositDetailsCardSelector.InterestRateRow}
                    label={<Trans>Interest Rate</Trans>}
                    value={`${formatRateDigits(interestRate)}%`}
                />
            ) : null}

            {isDefined(deadline) ? (
                <DepositDetailsRow
                    testID={DepositDetailsCardSelector.MaturityDateRow}
                    label={<Trans>Maturity Date</Trans>}
                    value={formatDayAndFullMonthAndYear(deadline)}
                />
            ) : null}

            {isDefined(daysRemaining) ? (
                <DepositDetailsRow
                    testID={DepositDetailsCardSelector.DaysRemainingRow}
                    label={<Trans>Days Remaining</Trans>}
                    value={formatCountDigits(daysRemaining)}
                />
            ) : null}

            {isDefined(expectedPayout) ? (
                <DepositDetailsRow
                    testID={DepositDetailsCardSelector.ExpectedPayoutRow}
                    label={<Trans>Expected Payout</Trans>}
                    value={
                        <ProtectedMoney
                            instrumentSymbol={instrumentSymbol}
                            className="font-semibold"
                            fontSize={14}
                            minFontSize={14}
                            maxFontSize={14}
                        >
                            {expectedPayout}
                        </ProtectedMoney>
                    }
                />
            ) : null}
        </View>
    );
};
