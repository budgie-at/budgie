import { UserIconNameEnum } from '@budgie/contracts';
import { RecurringAlertEnum } from '@budgie/recurring';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useRecurringAlertMessage } from '../../hook/use-recurring-alert-message.hook';
import { RecurringDetailSelector } from '../recurring-detail-content/recurring-detail.selector';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

interface Props {
    readonly series: Pick<RecurringSeriesListItemInterface, 'alert' | 'priceChange' | 'endsAt'>;
}

const continuousCorners = { borderCurve: 'continuous' as const };

const containerVariants = cva('flex-row items-center gap-x-lg rounded-3xl border p-3xl', {
    variants: {
        alert: {
            [RecurringAlertEnum.OVERDUE]: 'border-destructive-corner bg-destructive-background',
            [RecurringAlertEnum.PRICE_CHANGE]: 'border-warning-corner bg-warning-background',
            [RecurringAlertEnum.ENDING]: 'border-warning-corner bg-warning-background'
        }
    }
});

const textVariants = cva('', {
    variants: {
        alert: {
            [RecurringAlertEnum.OVERDUE]: 'text-destructive-foreground',
            [RecurringAlertEnum.PRICE_CHANGE]: 'text-warning-foreground',
            [RecurringAlertEnum.ENDING]: 'text-warning-foreground'
        }
    }
});

export const RecurringDetailAlertBanner = ({ series }: Props) => {
    const getAlertMessage = useRecurringAlertMessage();
    const { alert } = series;
    const message = getAlertMessage(series);

    if (!isDefined(alert) || !isDefined(message)) {
        return null;
    }

    const textClassName = textVariants({ alert });

    return (
        <View
            className={containerVariants({ alert })}
            style={continuousCorners}
            testID={RecurringDetailSelector.AlertBanner}
            accessibilityRole="alert"
        >
            <Icon icon={UserIconNameEnum.TriangleAlert} size={20} className={textClassName} />
            <Text className={`flex-1 text-[15px] leading-[20px] ${textClassName}`}>{message}</Text>
        </View>
    );
};
