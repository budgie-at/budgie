import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { SelectorRowTitle } from '../../../@generic/component/selector-row-title/selector-row-title';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { YIELD_KIND_DESCRIPTION } from '../../constant/yield-kind-description.constant';
import { YIELD_KIND_LABEL } from '../../constant/yield-kind-label.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldKindEnum } from '@budgie/contracts';

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
