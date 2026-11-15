import { useLingui } from '@lingui/react/macro';

import { SelectorRow } from '../../../@generic/component/selector-row/selector-row';
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

    return (
        <SelectorRow
            left={null}
            title={t(YIELD_KIND_LABEL[kind])}
            isSelected={isSelected}
            onPress={handleSelect}
            testID={PassiveIncomeSelector.KindOption(kind)}
        />
    );
};
