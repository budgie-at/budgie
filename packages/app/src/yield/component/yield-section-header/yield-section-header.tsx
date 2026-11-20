import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { YIELD_RANGE_NAME } from '../../constant/yield-range-name.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldListSectionEnum } from '../../enum/yield-list-section.enum';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { MessageDescriptor } from '@lingui/core';

interface Props {
    readonly section: YieldListSectionEnum;
}

const SECTION_TITLE: Readonly<Record<YieldListSectionEnum, MessageDescriptor>> = {
    [YieldListSectionEnum.ACTIVE]: msg`Active`,
    [YieldListSectionEnum.CLOSED]: msg`Closed`,
    [YieldListSectionEnum.UNASSIGNED]: msg`Not linked to a holding`,
    [YieldListSectionEnum.PAYOUTS]: msg`Payouts`
};

export const YieldSectionHeader = ({ section }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);

    const isPositionSection = section === YieldListSectionEnum.ACTIVE || section === YieldListSectionEnum.CLOSED;
    const rangeName = t(YIELD_RANGE_NAME[screenKey.key.range]);

    return (
        <View className="gap-y-xxs px-3xl pt-3xl pb-sm" testID={PassiveIncomeSelector.Section(section)}>
            <View className="flex-row items-baseline justify-between gap-x-lg">
                <Text accessibilityRole="header" className="shrink text-[17px] font-semibold text-primary">
                    {t(SECTION_TITLE[section])}
                </Text>
                {isPositionSection ? (
                    <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={1.6}>
                        {rangeName}
                    </Text>
                ) : null}
            </View>
            {section === YieldListSectionEnum.UNASSIGNED ? (
                <Text className="text-[13px] leading-[18px] text-secondary-foreground">
                    <Trans>Payouts we couldn’t match to a deposit or exchange asset</Trans>
                </Text>
            ) : null}
        </View>
    );
};
