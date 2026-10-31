import { RunwayDriverDimensionEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { RunwaySelector } from '../../runway.selector';
import { RunwayDriverRow } from '../runway-driver-row/runway-driver-row';
import { RunwaySection } from '../runway-section/runway-section';

import type { RunwayDriverInterface } from '../../interface/runway-driver.interface';

interface Props {
    readonly drivers: readonly RunwayDriverInterface[];
    readonly dimension: RunwayDriverDimensionEnum;
    readonly onChangeDimension: (dimension: RunwayDriverDimensionEnum) => void;
}

export const RunwayDrivers = ({ drivers, dimension, onChangeDimension }: Props) => {
    const { t } = useLingui();

    const options = [
        { value: RunwayDriverDimensionEnum.CATEGORY, label: t`By category` },
        { value: RunwayDriverDimensionEnum.TAG, label: t`By tag` }
    ];
    const maxAmount = drivers.reduce(
        (maximum, driver) => (isPositiveNumber(driver.foldedDriverCount) ? maximum : Math.max(maximum, driver.monthlyAmount)),
        0
    );

    return (
        <RunwaySection
            title={t`What's driving it`}
            testID={RunwaySelector.Drivers}
            accessory={<SegmentedTabs options={options} value={dimension} onChange={onChangeDimension} />}
        >
            {isNotEmptyArray(drivers) ? (
                <View className="py-sm">
                    {drivers.map((driver, index) => (
                        <RunwayDriverRow
                            key={`${driver.id ?? ''}-${driver.foldedDriverCount}`}
                            driver={driver}
                            dimension={dimension}
                            maxAmount={maxAmount}
                            rank={index}
                        />
                    ))}
                </View>
            ) : (
                <Text className="px-3xl py-xl text-sm text-secondary-foreground">
                    <Trans>No spending in this window.</Trans>
                </Text>
            )}
        </RunwaySection>
    );
};
