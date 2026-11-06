import { RecurringSeriesKindEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useRecurringDueLabel } from '../../hook/use-recurring-due-label.hook';
import { useRecurringScheduleDescription } from '../../hook/use-recurring-schedule-description.hook';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';
import { RecurringMerchantTile } from '../recurring-merchant-tile/recurring-merchant-tile';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: RecurringSeriesListItemInterface;
    readonly now: Date;
}

const amountVariants = cva('mt-2xl text-center text-[44px] font-bold leading-[52px] tracking-[-1px] tabular-nums', {
    variants: { kind: { [RecurringSeriesKindEnum.EXPENSE]: 'text-primary', [RecurringSeriesKindEnum.INCOME]: 'text-positive-strong' } }
});

const continuousCorners = { borderCurve: 'continuous' as const };

export const RecurringDetailHero = ({ series, now }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const getScheduleDescription = useRecurringScheduleDescription();
    const getDueLabel = useRecurringDueLabel();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();
    const amount = protectAmount(convertFromMicroUnits(series.amount), defaultInstrument.symbol);
    const nextDateLabel = isDefined(series.nextDate)
        ? (getDueLabel(series.nextDate, now) ?? formatMonthAndDayAndOptionalYear(series.nextDate))
        : null;
    const statusLabel = isDefined(nextDateLabel) ? t`Next payment · ${nextDateLabel}` : t`No upcoming payment`;
    const meta = [series.categoryTitle, getScheduleDescription(series)].filter(isDefined).join(' · ');

    return (
        <View className="items-center pt-3xl">
            <RecurringMerchantTile title={series.title} size={72} />
            <Text className="mt-xl text-center text-[22px] font-semibold leading-[28px] text-primary" selectable>
                {series.title}
            </Text>
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.6}
                className={amountVariants({ kind: series.kind })}
                testID={RecurringDetailSelector.Amount}
                selectable
            >
                {amount}
            </Text>
            <Text className="mt-xs text-center text-[15px] text-secondary-foreground">{meta}</Text>
            <View className="mt-xl rounded-full bg-grouped-surface-row px-xl py-sm" style={continuousCorners}>
                <Text className="text-[14px] font-semibold text-primary">{statusLabel}</Text>
            </View>
        </View>
    );
};
