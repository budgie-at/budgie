import { RunwayDriverDimensionEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { SectionHeader } from '../../../@generic/component/section-header/section-header';
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
        <View collapsable={false} testID={RunwaySelector.Drivers} className="gap-y-lg">
            <SectionHeader label={t`What's driving it`} />

            <SegmentedTabs options={options} value={dimension} onChange={onChangeDimension} />

            {isNotEmptyArray(drivers) ? (
                <View className="gap-y-lg">
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
        </View>
    );
};
