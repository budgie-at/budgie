import { YieldGroupEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { Text } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly bucket: YieldBucketInterface;
}

const ROW_MAX_FONT_SIZE_MULTIPLIER = 1.5;

export const YieldChartSummaryRow = ({ summary, bucket }: Props) => {
    const { t } = useLingui();
    const { formatPeriod } = useYieldDateLabels();
    const { formatMonthAndDay } = useFormatDate();
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const isSinglePayout = summary.payoutCount === 1 && isDefined(summary.lastPayoutDay);
    const date =
        isSinglePayout && isDefined(summary.lastPayoutDay)
            ? formatMonthAndDay(parseISO(summary.lastPayoutDay))
            : formatPeriod(bucket, summary.bucketUnit);
    const amount = formatAmount(bucket.total, symbol);
    const bucketTax = bucket.amounts[YieldGroupEnum.TAX];
    const tax = formatAmount(bucketTax, symbol);
    const text = isPositiveNumber(bucketTax) ? t`${date} · ${amount} · −${tax} tax` : t`${date} · ${amount}`;

    return (
        <Text className="text-md tabular-nums text-secondary-foreground" maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
            {text}
        </Text>
    );
};
