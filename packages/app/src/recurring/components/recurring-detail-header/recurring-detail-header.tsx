import { View } from 'react-native';

import { ScreenChromeHeader } from '@rnw-community/react-native-screen-chrome';

import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { TransactionInfoNavBand } from '../../../transaction/components/transaction-info-nav-band/transaction-info-nav-band';
import { RecurringDetailEditButton } from '../recurring-detail-edit-button/recurring-detail-edit-button';
import { RecurringDetailMenu } from '../recurring-detail-menu/recurring-detail-menu';
import { RecurringDetailNavTitle } from '../recurring-detail-nav-title/recurring-detail-nav-title';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: RecurringSeriesListItemInterface;
    readonly onGoBack: () => void;
}

export const RecurringDetailHeader = ({ series, onGoBack }: Props) => (
    <>
        <TransactionInfoNavBand />
        <RecurringDetailNavTitle title={series.title} />
        <ScreenChromeHeader>
            <GoBackButton onPress={onGoBack} />
            <View className="flex-row items-center gap-x-lg">
                <RecurringDetailMenu series={series} />
                <RecurringDetailEditButton seriesId={series.id} />
            </View>
        </ScreenChromeHeader>
    </>
);
