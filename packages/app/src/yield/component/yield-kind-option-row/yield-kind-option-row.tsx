import { UserIconNameEnum, YieldKindEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { SelectorRowTitle } from '../../../@generic/component/selector-row-title/selector-row-title';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { YIELD_KIND_LABEL } from '../../constant/yield-kind-label.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { MessageDescriptor } from '@lingui/core';

const YIELD_KIND_DESCRIPTION: Readonly<Record<YieldKindEnum, MessageDescriptor>> = {
    [YieldKindEnum.STAKING]: msg`Crypto staking rewards`,
    [YieldKindEnum.EARN]: msg`Flexible savings on exchanges`,
    [YieldKindEnum.DISTRIBUTION]: msg`From property and income funds, not counted in yield`,
    [YieldKindEnum.DIVIDEND]: msg`Paid by stocks and dividend ETFs`,
    [YieldKindEnum.INTEREST]: msg`Savings and deposits`,
    [YieldKindEnum.TAX]: msg`Tax withheld from a payout`,
    [YieldKindEnum.NONE]: msg`Excluded from all passive income totals`
};

interface Props {
    readonly kind: YieldKindEnum;
    readonly isSelected: boolean;
    readonly onSelect: (kind: YieldKindEnum) => void;
}

export const YieldKindOptionRow = ({ kind, isSelected, onSelect }: Props) => {
    const { t } = useLingui();

    const handleSelect = () => void onSelect(kind);

    const pressableProps = { pressFeedback: HapticPressFeedbackEnum.SELECTION, accessibilityState: { selected: isSelected } };
    const check = isSelected ? (
        <Icon icon={UserIconNameEnum.Check} size={22} className="text-positive-action" />
    ) : (
        <View className="w-[22px]" />
    );

    return (
        <GroupedListRow
            title={<SelectorRowTitle text={t(YIELD_KIND_LABEL[kind])} isSelected={isSelected} />}
            subtitle={t(YIELD_KIND_DESCRIPTION[kind])}
            right={check}
            onPress={handleSelect}
            pressableProps={pressableProps}
            testID={PassiveIncomeSelector.KindOption(kind)}
        />
    );
};
