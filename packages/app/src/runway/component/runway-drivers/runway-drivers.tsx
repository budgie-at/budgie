import { RunwayDriverDimensionEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Fragment } from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { SegmentedTabs } from '../../../@generic/component/segmented-tabs/segmented-tabs';
import { RUNWAY_FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/runway-footnote-max-font-size-multiplier.constant';
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
            accessory={
                <View className="gap-y-md">
                    <Text
                        maxFontSizeMultiplier={RUNWAY_FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER}
                        className="-mt-xs px-3xl text-[13px] text-secondary-foreground"
                    >
                        <Trans>Average per month</Trans>
                    </Text>

                    <SegmentedTabs options={options} value={dimension} onChange={onChangeDimension} />
                </View>
            }
        >
            {isNotEmptyArray(drivers) ? (
                <View className="py-sm">
                    {drivers.map((driver, index) => (
                        <Fragment key={`${driver.id ?? ''}-${driver.foldedDriverCount}`}>
                            {isPositiveNumber(driver.foldedDriverCount) ? (
                                <View className="mx-3xl mt-sm mb-xs h-hairline bg-surface-separator" />
                            ) : null}
                            <RunwayDriverRow driver={driver} dimension={dimension} maxAmount={maxAmount} rank={index} />
                        </Fragment>
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
