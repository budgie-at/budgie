import { RecurringSeriesKindEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useRecurringScheduleDescription } from '../../hook/use-recurring-schedule-description.hook';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: RecurringSeriesListItemInterface;
}

const amountVariants = cva('mt-xl text-center text-[40px] font-semibold leading-[48px] tracking-[-1px] tabular-nums', {
    variants: { kind: { [RecurringSeriesKindEnum.EXPENSE]: 'text-primary', [RecurringSeriesKindEnum.INCOME]: 'text-positive-strong' } }
});

export const RecurringDetailHero = ({ series }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const protectAmount = useProtectedAmountLabel();
    const { formatWeekdayAndDay } = useFormatDate();
    const getScheduleDescription = useRecurringScheduleDescription();
    const amount = protectAmount(convertFromMicroUnits(series.amount), defaultInstrument.symbol);
    const nextDateLabel = isDefined(series.nextDate) ? formatWeekdayAndDay(series.nextDate) : '';
    const nextLabel = isDefined(series.nextDate) ? t`Next: ${nextDateLabel}` : null;

    return (
        <View className="items-center pt-3xl">
            <CircleIcon
                size={64}
                iconSize={30}
                radius={32}
                border={false}
                icon={series.categoryIcon ?? UserIconNameEnum.Wallet}
                variant="secondary"
            />
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
            <Text className="mt-xs text-center text-[20px] font-semibold leading-[25px] text-primary" selectable>
                {series.title}
            </Text>
            <Text className="mt-xs text-center text-[15px] text-secondary-foreground">{getScheduleDescription(series)}</Text>
            {isDefined(nextLabel) ? <Text className="text-center text-[15px] text-secondary-foreground">{nextLabel}</Text> : null}
        </View>
    );
};
