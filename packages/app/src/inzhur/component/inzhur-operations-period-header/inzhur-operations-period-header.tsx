import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

import type { InzhurOperationsImportSummaryInterface } from '@budgie/sync';

interface Props {
    readonly summary: Pick<InzhurOperationsImportSummaryInterface, 'periodFrom' | 'periodTo' | 'isFullHistory'>;
}

export const InzhurOperationsPeriodHeader = ({ summary }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDayAndOptionalYear } = useFormatDate();

    const periodFrom = formatMonthAndDayAndOptionalYear(summary.periodFrom);
    const periodTo = formatMonthAndDayAndOptionalYear(summary.periodTo);
    const coverageLabel = summary.isFullHistory
        ? t`Full history. Cash now matches your Inzhur account.`
        : t`Part of your history. The cash you started with was kept.`;

    return (
        <View accessible className="items-stretch gap-y-xs">
            <Text className="text-center text-[15px] leading-[20px] text-secondary-foreground">{t`Operations imported`}</Text>
            <Text className="text-center text-[22px] leading-[28px] font-semibold text-primary tabular-nums">{t`${periodFrom} – ${periodTo}`}</Text>
            <Text className="px-3xl text-center text-[15px] leading-[20px] text-secondary-foreground">{coverageLabel}</Text>
        </View>
    );
};
