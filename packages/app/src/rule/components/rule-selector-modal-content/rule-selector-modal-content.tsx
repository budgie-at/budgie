import { ScrollView, View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { MORPHING_SHEET_SELECTOR_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { useMorphingSheetListHeight } from '../../../@generic/hook/use-morphing-sheet-list-height.hook';
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
    const { height } = useMorphingSheetListHeight(MORPHING_SHEET_SELECTOR_HEIGHT_RATIO);
    const commit = useMorphingSheetCommit(onCommit);
    const scrollStyle = { flexGrow: 0, maxHeight: height };

    return (
        <SheetSurface
            className="flex-none pt-lg"
            contentClassName="flex-none"
            header={
                <View className="px-xl">
                    <SheetTitleRow title={title} />
                </View>
            }
        >
            <ScrollView style={scrollStyle} bounces={false} showsVerticalScrollIndicator={false}>
                <View className="px-3xl pt-xl pb-[16px]">
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
                </View>
            </ScrollView>
        </SheetSurface>
    );
};
