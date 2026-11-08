import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { ScrollableSheetCard } from '../../../@generic/component/scrollable-sheet-card/scrollable-sheet-card';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { RuleFormSelector } from '../rule-form-layout/rule-form-layout.selector';
import { RuleSelectorOptionRow } from '../rule-selector-option-row/rule-selector-option-row';

import type { RuleSelectorOptionInterface } from '../../interface/rule-selector-option.interface';

interface Props {
    readonly title: string;
    readonly options: readonly RuleSelectorOptionInterface[];
    readonly selectedValue: string | null;
    readonly onCommit: (value: string) => void;
}

export const RuleSelectorModalContent = ({ title, options, selectedValue, onCommit }: Props) => {
    const commit = useMorphingSheetCommit(onCommit);

    return (
        <ScrollableSheetCard
            header={
                <View className="px-xl">
                    <SheetTitleRow title={title} />
                </View>
            }
            ratio={MORPHING_SHEET_SELECTOR_HEIGHT_RATIO}
            contentClassName="px-3xl pt-xl pb-[16px]"
        >
            <GroupedListSection>
                {options.map(option => (
                    <RuleSelectorOptionRow
                        key={option.value}
                        option={option}
                        isSelected={option.value === selectedValue}
                        onPress={commit}
                        testID={RuleFormSelector.SelectorCard(option.value)}
                    />
                ))}
            </GroupedListSection>
        </ScrollableSheetCard>
    );
};
