import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HorizontalCell } from '../../../@generic/component/horizontal-cell/horizontal-cell';
import { FuturePeriodStatus } from '../future-period-status/future-period-status';

interface FuturePeriod {
    readonly startDate: Date;
    readonly endDate: Date;
    readonly label: string;
}

interface Props {
    readonly period: FuturePeriod;
    readonly creatingPeriod: string | null;
    readonly createdPeriods: Set<string>;
    readonly formatDateRange: (startDate: Date, endDate: Date) => string;
    readonly onCreatePeriod: (period: FuturePeriod) => void;
}

const cellClassName = cva('', {
    variants: {
        isCreated: {
            true: 'bg-positive-background border-positive-corner',
            false: 'bg-secondary-background border-secondary-corner'
        }
    }
});

export const FuturePeriodItem = ({ period, creatingPeriod, createdPeriods, formatDateRange, onCreatePeriod }: Props) => {
    const isCreated = createdPeriods.has(period.label);
    const isCreating = creatingPeriod === period.label;
    const isDisabled = isCreated || isDefined(creatingPeriod);
    const dateRange = formatDateRange(period.startDate, period.endDate);
    const handlePress = () => void onCreatePeriod(period);

    return (
        <HorizontalCell
            size="sm"
            right={<FuturePeriodStatus isCreated={isCreated} isCreating={isCreating} />}
            className={cellClassName({ isCreated })}
            {...(!isDisabled && { onPress: handlePress })}
        >
            <Text className="text-sm font-medium text-primary">{period.label}</Text>
            <Text className="text-xs text-secondary-foreground">{dateRange}</Text>
        </HorizontalCell>
    );
};
