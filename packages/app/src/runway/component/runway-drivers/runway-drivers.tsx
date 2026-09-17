import { RunwayDriverDimensionEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { RunwaySelector } from '../../runway.selector';
import { RunwayDriverRow } from '../runway-driver-row/runway-driver-row';

import type { RunwayDriverInterface } from '../../interface/runway-driver.interface';

interface Props {
    readonly drivers: readonly RunwayDriverInterface[];
    readonly dimension: RunwayDriverDimensionEnum;
    readonly onChangeDimension: (dimension: RunwayDriverDimensionEnum) => void;
}

export const RunwayDrivers = (props: Props) => {
    const { drivers, dimension, onChangeDimension } = props;
    const { t } = useLingui();

    const options = [
        { value: RunwayDriverDimensionEnum.CATEGORY, label: t`Categories` },
        { value: RunwayDriverDimensionEnum.TAG, label: t`Tags` }
    ];
    const maxAmount = drivers.reduce((maximum, driver) => Math.max(maximum, driver.monthlyAmount), 0);

    return (
        <Card testID={RunwaySelector.Drivers} className="gap-y-xl">
            <View className="gap-y-lg">
                <Text className="text-xxs uppercase tracking-wider text-secondary-foreground">{t`What's driving it`}</Text>

                <SegmentedTabs options={options} value={dimension} onChange={onChangeDimension} />
            </View>

            {isNotEmptyArray(drivers) ? (
                <View className="gap-y-xl">
                    {drivers.map(driver => (
                        <RunwayDriverRow
                            key={`${driver.id ?? ''}-${driver.foldedDriverCount}`}
                            driver={driver}
                            dimension={dimension}
                            maxAmount={maxAmount}
                        />
                    ))}
                </View>
            ) : (
                <Text className="text-sm text-secondary-foreground">
                    <Trans>No spending in this window.</Trans>
                </Text>
            )}
        </Card>
    );
};
