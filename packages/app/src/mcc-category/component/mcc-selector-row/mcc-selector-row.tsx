import { MccCategoryEntityInterface } from '@budgie/contracts';

import { emptyFn } from '@rnw-community/shared';

import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { SelectorCodeDisc } from '../../../@generic/component/selector-code-disc/selector-code-disc';
import { SelectorRowTitle } from '../../../@generic/component/selector-row-title/selector-row-title';
import { SelectorRow } from '../../../@generic/component/selector-row/selector-row';
import { RuleMccSelectorModalSelector } from '../../../app/rule-mcc-selector-modal.selector';

interface Props {
    readonly item: MccCategoryEntityInterface;
    readonly index: number;
    readonly lastIndex: number;
    readonly selectedMcc: string | null;
    readonly onSelect: (mcc: string) => void;
    readonly highlight: string;
}

export const MccSelectorRow = ({ item, index, lastIndex, selectedMcc, onSelect, highlight }: Props) => {
    const testID = RuleMccSelectorModalSelector.Card(item.mcc);
    const isSelected = item.mcc === selectedMcc;
    const handleSelect = isSelected ? emptyFn : () => void onSelect(item.mcc);
    const subtitle = item.fullDescription === item.shortDescription ? null : item.fullDescription;

    return (
        <GroupedListItem isFirst={index === 0} isLast={index === lastIndex}>
            <SelectorRow
                testID={testID}
                isSelected={isSelected}
                title={<SelectorRowTitle text={item.shortDescription} highlight={highlight} isSelected={isSelected} />}
                subtitle={subtitle}
                onPress={handleSelect}
                left={<SelectorCodeDisc code={item.mcc} isSelected={isSelected} />}
            />
        </GroupedListItem>
    );
};
