import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { ScreenChromeFrame, ScreenChromeScrollView, useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { TRANSACTION_INFO_SCROLL_BOTTOM_INSET } from '../../../transaction/constant/transaction-info-scroll-bottom-inset.constant';
import { useRecurringNow } from '../../hook/use-recurring-now.hook';
import { useRemoveRecurringSeries } from '../../hook/use-remove-recurring-series.hook';
import { RecurringDetailAlertBanner } from '../recurring-detail-alert-banner/recurring-detail-alert-banner';
import { RecurringDetailDestructiveRow } from '../recurring-detail-destructive-row/recurring-detail-destructive-row';
import { RecurringDetailHeader } from '../recurring-detail-header/recurring-detail-header';
import { RecurringDetailHero } from '../recurring-detail-hero/recurring-detail-hero';
import { RecurringDetailHistory } from '../recurring-detail-history/recurring-detail-history';
import { RecurringDetailNextPayments } from '../recurring-detail-next-payments/recurring-detail-next-payments';
import { RecurringDetailReminderRow } from '../recurring-detail-reminder-row/recurring-detail-reminder-row';
import { RecurringDetailStats } from '../recurring-detail-stats/recurring-detail-stats';

import { RecurringDetailSelector } from './recurring-detail.selector';

import type { RecurringSeriesDetailInterface } from '@budgie/recurring';

interface Props {
    readonly detail: RecurringSeriesDetailInterface;
}

export const RecurringDetailContent = ({ detail }: Props) => {
    const router = useRouter();
    const { config } = useScreenChrome();
    const removeSeries = useRemoveRecurringSeries();
    const now = useRecurringNow();
    const { series, nextDates, history } = detail;

    const handleGoBack = () => void router.back();
    const handleRemove = () => void removeSeries(series, handleGoBack);

    return (
        <ScreenChromeFrame testID={RecurringDetailSelector.Page}>
            <ScreenChromeScrollView
                contentInsetTop={config.headerHeight}
                contentInsetBottom={TRANSACTION_INFO_SCROLL_BOTTOM_INSET}
                showsVerticalScrollIndicator={false}
            >
                <View className="gap-y-5xl px-3xl">
                    <RecurringDetailHero series={series} now={now} />
                    <RecurringDetailStats kind={series.kind} history={history} />
                    <RecurringDetailAlertBanner series={series} />
                    {series.isActive ? <RecurringDetailNextPayments dates={nextDates} amount={series.amount} now={now} /> : null}
                    <RecurringDetailHistory seriesId={series.id} kind={series.kind} history={history} />
                    {series.isActive ? <RecurringDetailReminderRow series={series} /> : null}
                    <RecurringDetailDestructiveRow source={series.source} onRemove={handleRemove} />
                </View>
            </ScreenChromeScrollView>

            <RecurringDetailHeader series={series} onGoBack={handleGoBack} />
        </ScreenChromeFrame>
    );
};
