import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

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

    return (
        <View className="gap-y-xxs bg-surface px-3xl pt-3xl pb-sm" testID={PassiveIncomeSelector.Section(section)}>
            <Text accessibilityRole="header" className="text-xs font-semibold uppercase text-secondary-foreground">
                {t(SECTION_TITLE[section])}
            </Text>
            {section === YieldListSectionEnum.UNASSIGNED ? (
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Payouts we couldn’t match to a deposit or exchange asset</Trans>
                </Text>
            ) : null}
        </View>
    );
};
