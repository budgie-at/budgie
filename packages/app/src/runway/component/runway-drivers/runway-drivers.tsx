import { RunwayDriverDimensionEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { RunwayAllInToggle } from '../runway-all-in-toggle/runway-all-in-toggle';
import { RunwayDriverRow } from '../runway-driver-row/runway-driver-row';

import type { RunwayDriverInterface } from '../../interface/runway-driver.interface';

interface Props {
    readonly drivers: readonly RunwayDriverInterface[];
    readonly dimension: RunwayDriverDimensionEnum;
    readonly onChangeDimension: (dimension: RunwayDriverDimensionEnum) => void;
    readonly isAllIn: boolean;
    readonly onToggleAllIn: () => void;
}

export const RunwayDrivers = (props: Props) => {
    const { drivers, dimension, onChangeDimension, isAllIn, onToggleAllIn } = props;
    const { t } = useLingui();

    const title = t`What's driving it`;
    const options = [
        { value: RunwayDriverDimensionEnum.CATEGORY, label: t`Categories` },
        { value: RunwayDriverDimensionEnum.TAG, label: t`Tags` }
    ];
    const maxAmount = drivers.reduce((maximum, driver) => Math.max(maximum, driver.monthlyAmount), 0);
    const hasDrivers = isNotEmptyArray(drivers);

    return (
        <Card className="gap-y-xl">
            <View className="flex-row items-center justify-between">
                <Text className="text-xxs uppercase tracking-wider text-secondary-foreground">{title}</Text>
                <View className="w-40">
                    <SegmentedTabs options={options} value={dimension} onChange={onChangeDimension} />
                </View>
            </View>

            {hasDrivers ? (
                <View className="gap-y-xl">
                    {drivers.map(driver => (
                        <RunwayDriverRow key={driver.id ?? driver.title} driver={driver} maxAmount={maxAmount} />
                    ))}
                </View>
            ) : (
                <Text className="text-sm text-secondary-foreground">
                    <Trans>No spending in this window.</Trans>
                </Text>
            )}

            <View className="flex-row items-center justify-between gap-x-md border-t border-secondary-corner pt-xl">
                <Text className="flex-1 text-xs text-secondary-foreground">
                    <Trans>One-offs are excluded from the base rate.</Trans>
                </Text>
                <RunwayAllInToggle isAllIn={isAllIn} onToggle={onToggleAllIn} />
            </View>
        </Card>
    );
};
