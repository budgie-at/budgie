import { Trans, useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldScreenKeyInterface } from '../../interface/yield-screen-key.interface';

interface Props {
    readonly screenKey: YieldScreenKeyInterface;
}

export const YieldInfoSheetContent = ({ screenKey }: Props) => {
    const { t } = useLingui();
    const { formatDayAndMonthAndYear } = useFormatDate();
    const { formatRangeCaption } = useYieldDateLabels();
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    const windowStart = isDefined(summary) ? formatDayAndMonthAndYear(parseISO(summary.windowStart)) : '';
    const today = isDefined(summary) ? formatDayAndMonthAndYear(parseISO(summary.today)) : '';
    const caption = isDefined(summary) ? formatRangeCaption(screenKey.key.range, summary.windowStart) : '';
    const periodText = t`Earned ${caption}: ${windowStart} – ${today}. The change compares the same number of periods just before, with the last one cut to the same point.`;
    const causes = (summary?.estimateCauses ?? []).map(cause => {
        const { instrumentCode } = cause;
        const day = formatDayAndMonthAndYear(parseISO(cause.day));
        const sourceDay = isDefined(cause.sourceDay) ? formatDayAndMonthAndYear(parseISO(cause.sourceDay)) : '';

        return isDefined(cause.sourceDay)
            ? t`No price for ${instrumentCode} on ${day} · estimated from ${sourceDay}`
            : t`No price for ${instrumentCode} on ${day} · estimated from the latest rate`;
    });

    return (
        <ScrollView className="max-h-[560px]" contentContainerClassName="gap-y-lg px-3xl pb-3xl" testID={PassiveIncomeSelector.InfoSheet}>
            <Text accessibilityRole="header" className="text-lg font-semibold text-primary">
                <Trans>About these figures</Trans>
            </Text>
            <Text className="text-md text-primary">{periodText}</Text>
            <Text className="text-md text-primary">
                <Trans>
                    Earned is before tax. Rewards are valued at the day’s opening price, using the most recent price within 3 days (fund
                    prices within 31 days).
                </Trans>
            </Text>
            <Text className="text-md text-primary">
                <Trans>Annual yield uses the last 365 days. Crypto yield is measured on your whole balance, staked or not.</Trans>
            </Text>
            <Text className="text-md text-primary">
                <Trans>
                    Distributions count as income but not in the yield. Holdings shown with “—” are left out of the yield and of “At this
                    pace”.
                </Trans>
            </Text>
            <Text className="text-md text-primary">
                <Trans>In Analytics, the small bars are scaled to each period.</Trans>
            </Text>
            {isNotEmptyArray(causes) ? (
                <View className="gap-y-xs">
                    <Text className="text-md font-semibold text-primary">
                        <Trans>≈ includes estimated values</Trans>
                    </Text>
                    {causes.map(cause => (
                        <Text key={cause} className="text-sm text-secondary-foreground">
                            {cause}
                        </Text>
                    ))}
                </View>
            ) : null}
        </ScrollView>
    );
};
