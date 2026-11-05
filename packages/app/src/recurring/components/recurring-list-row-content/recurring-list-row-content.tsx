import { RecurringSeriesKindEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useRecurringCadenceLabel } from '../../hook/use-recurring-cadence-label.hook';
import { RecurringAlertBadge } from '../recurring-alert-badge/recurring-alert-badge';
import { RecurringRowLayout } from '../recurring-row-layout/recurring-row-layout';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: RecurringSeriesListItemInterface;
    readonly isPossible: boolean;
}

const amountVariants = cva('text-[16px] font-semibold tabular-nums', {
    variants: { kind: { [RecurringSeriesKindEnum.EXPENSE]: 'text-primary', [RecurringSeriesKindEnum.INCOME]: 'text-positive-strong' } }
});

export const RecurringListRowContent = ({ series, isPossible }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const isAccessibilityTextSize = useIsAccessibilityTextSize();
    const { formatWeekdayAndDay } = useFormatDate();
    const getCadenceLabel = useRecurringCadenceLabel();
    const cadence = getCadenceLabel(series.cadenceUnit, series.cadenceInterval);
    const nextDateLabel = isDefined(series.nextDate) ? formatWeekdayAndDay(series.nextDate) : '';
    const nextLabel = isDefined(series.nextDate) ? t`next ${nextDateLabel}` : t`no upcoming payment`;
    const subtitleLineLimit = isAccessibilityTextSize ? 0 : 2;
    const seenCount = series.linkedCount;
    const subtitle = isPossible ? t`Seen ${seenCount}× · ${cadence}` : `${cadence} · ${nextLabel}`;
    const amount = protectAmount(convertFromMicroUnits(series.amount), defaultInstrument.symbol);

    return (
        <RecurringRowLayout
            icon={series.categoryIcon}
            title={series.title}
            trailing={
                <View className="shrink-0 items-end gap-y-xxs">
                    <Text dynamicTypeRamp="headline" className={amountVariants({ kind: series.kind })}>
                        {amount}
                    </Text>
                    <RecurringAlertBadge alert={series.alert} priceChange={series.priceChange} endsAt={series.endsAt} />
                </View>
            }
        >
            <Text
                dynamicTypeRamp="footnote"
                className="text-[12px] text-secondary-foreground"
                numberOfLines={subtitleLineLimit}
                ellipsizeMode="tail"
            >
                {subtitle}
            </Text>
        </RecurringRowLayout>
    );
};
