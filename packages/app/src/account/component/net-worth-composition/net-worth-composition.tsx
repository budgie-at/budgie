import { AccountTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { emptyFn, isPositiveNumber } from '@rnw-community/shared';

import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { StatisticsShareBar } from '../../../transaction/components/statistics-share-bar/statistics-share-bar';
import { ACCOUNT_TYPE_SWATCH } from '../../constant/account-type-swatch.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { isDebtSection } from '../../type-guard/is-debt-section.type-guard';

import { NetWorthCompositionSelector } from './net-worth-composition.selector';

import type { HomeSectionInterface } from '../../interface/home-section.interface';

interface Props {
    readonly sections: readonly HomeSectionInterface[];
    readonly cashTotal: number;
}

export const NetWorthComposition = ({ sections, cashTotal }: Props) => {
    const { t } = useLingui();

    const groups = [
        ...sections.flatMap(section => (isDebtSection(section) ? [] : [{ type: section.type, total: section.total }])),
        { type: AccountTypeEnum.CASH, total: cashTotal }
    ];
    const segments = groups
        .filter(group => isPositiveNumber(group.total))
        .sort((left, right) => right.total - left.total)
        .map(group => ({
            key: group.type,
            label: t(ACCOUNT_TYPE[group.type]),
            amount: group.total,
            swatchClassName: ACCOUNT_TYPE_SWATCH[group.type].fill
        }));

    if (segments.length < 2) {
        return null;
    }

    return (
        <View className="gap-y-md" testID={NetWorthCompositionSelector.Container}>
            <Text maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER} className="text-[13px] font-medium text-secondary-foreground">
                <Trans>Asset mix</Trans>
            </Text>
            <StatisticsShareBar segments={segments} other={null} onOtherPress={emptyFn} />
        </View>
    );
};
