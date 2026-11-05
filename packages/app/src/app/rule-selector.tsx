import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GroupedListSection } from '../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../@generic/component/grouped-surface/grouped-surface';
import { SheetTitleRow } from '../@generic/component/sheet-title-row/sheet-title-row';
import { GroupedSurfacePaletteEnum } from '../@generic/enum/grouped-surface-palette.enum';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { RuleFormSelector } from '../rule/components/rule-form-layout/rule-form-layout.selector';
import { RuleSelectorOptionRow } from '../rule/components/rule-selector-option-row/rule-selector-option-row';
import { useRuleSelectorModal, useRuleSelectorModalParams } from '../rule/context/rule-selector-modal.context';

export default function RuleSelectorModal() {
    const [, resolveRuleSelector, dismissRuleSelector] = useRuleSelectorModal();
    useModalDismiss(dismissRuleSelector);
    const currentParams = useRuleSelectorModalParams();
    const { top } = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const scrollStyle = { flexGrow: 0, maxHeight: height - top };

    const options = currentParams?.options ?? [];
    const selectedValue = currentParams?.selectedValue ?? null;

    return (
        <GroupedSurface palette={GroupedSurfacePaletteEnum.SHEET} className="flex-none">
            <ScrollView style={scrollStyle} bounces={false} showsVerticalScrollIndicator={false}>
                <View className="px-3xl pt-7xl pb-5xl">
                    <SheetTitleRow title={currentParams?.title ?? ''} />
                </View>
                <View className="px-3xl pb-safe-or-[16px]">
                    <GroupedListSection>
                        {options.map(option => (
                            <RuleSelectorOptionRow
                                key={option.value}
                                option={option}
                                isSelected={option.value === selectedValue}
                                onPress={resolveRuleSelector}
                                testID={RuleFormSelector.SelectorCard(option.value)}
                            />
                        ))}
                    </GroupedListSection>
                </View>
            </ScrollView>
        </GroupedSurface>
    );
}
