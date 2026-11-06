import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { TransactionCardLayout } from '../../../transaction/components/transaction-card-layout/transaction-card-layout';
import { TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER } from '../../../transaction/constant/transaction-secondary-max-font-size-multiplier.constant';
import { RecurringTileVariantEnum } from '../../enum/recurring-tile-variant.enum';
import { useRecurringCadenceLabel } from '../../hook/use-recurring-cadence-label.hook';
import { getRecurringTileVariant } from '../../utils/get-recurring-tile-variant.util';
import { RecurringListRowTrailing } from '../recurring-list-row-trailing/recurring-list-row-trailing';
import { RecurringMerchantTile } from '../recurring-merchant-tile/recurring-merchant-tile';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: RecurringSeriesListItemInterface;
    readonly isPossible: boolean;
    readonly now: Date;
}

export const RecurringListRowContent = ({ series, isPossible, now }: Props) => {
    const { t } = useLingui();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const getCadenceLabel = useRecurringCadenceLabel();
    const cadence = getCadenceLabel(series.cadenceUnit, series.cadenceInterval);
    const nextDateLabel = isDefined(series.nextDate) ? formatMonthAndDayAndOptionalYear(series.nextDate) : t`No upcoming payment`;
    const subtitleLineLimit = isAccessibilityTextSize ? 0 : 1;
    const seenCount = series.linkedCount;
    const tileVariant = isPossible ? RecurringTileVariantEnum.NEUTRAL : getRecurringTileVariant(series.title);
    const subtitle = isPossible ? t`Seen ${seenCount}× · ${cadence}` : `${nextDateLabel} · ${cadence}`;

    return (
        <TransactionCardLayout
            icon={<RecurringMerchantTile title={series.title} size={40} variant={tileVariant} />}
            title={
                <Text
                    dynamicTypeRamp="headline"
                    className="text-[16px] font-semibold text-primary"
                    numberOfLines={1}
                    lineBreakStrategyIOS="standard"
                >
                    {series.title}
                </Text>
            }
            amount={<RecurringListRowTrailing series={series} isPossible={isPossible} now={now} />}
        >
            <Text
                dynamicTypeRamp="footnote"
                maxFontSizeMultiplier={TRANSACTION_SECONDARY_MAX_FONT_SIZE_MULTIPLIER}
                className="text-[13px] text-secondary-foreground"
                numberOfLines={subtitleLineLimit}
                ellipsizeMode="tail"
            >
                {subtitle}
            </Text>
        </TransactionCardLayout>
    );
};
