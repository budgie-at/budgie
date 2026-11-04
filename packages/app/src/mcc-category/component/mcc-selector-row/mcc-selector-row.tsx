import { MccCategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';

import { emptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { SelectorRow } from '../../../@generic/component/selector-row/selector-row';
import { RuleMccSelectorModalSelector } from '../../../app/rule-mcc-selector-modal.selector';
import { formatMccDisplay } from '../../utils/format-mcc-display.util';

interface Props {
    readonly item: MccCategoryEntityInterface;
    readonly index: number;
    readonly lastIndex: number;
    readonly selectedMcc: string | null;
    readonly onSelect: (mcc: string) => void;
}

export const MccSelectorRow = ({ item, index, lastIndex, selectedMcc, onSelect }: Props) => {
    const testID = RuleMccSelectorModalSelector.Card(item.mcc);
    const isSelected = item.mcc === selectedMcc;
    const handleSelect = isSelected ? emptyFn : () => void onSelect(item.mcc);

    return (
        <GroupedListItem isFirst={index === 0} isLast={index === lastIndex}>
            <SelectorRow
                testID={testID}
                isSelected={isSelected}
                title={formatMccDisplay(item)}
                subtitle={item.fullDescription}
                onPress={handleSelect}
                left={
                    <CircleIcon
                        icon={UserIconNameEnum.CreditCard}
                        size={36}
                        iconSize={18}
                        radius={18}
                        variant="secondary"
                        border={false}
                        className="bg-surface-disc"
                    />
                }
            />
        </GroupedListItem>
    );
};
