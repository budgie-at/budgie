import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { SelectorRowTitle } from '../../../@generic/component/selector-row-title/selector-row-title';
import { SelectorRow } from '../../../@generic/component/selector-row/selector-row';
import { LanguageSelectorModalSelector } from '../../../app/language-selector-modal.selector';

import type { LanguageInterface } from '../../interface/language.interface';
import type { LanguageEnum } from '@budgie/contracts';

interface Props {
    readonly item: LanguageInterface;
    readonly selectedLanguage: LanguageEnum | undefined;
    readonly onSelect: (language: LanguageEnum) => void;
}

const discVariants = cva('h-[36px] w-[36px] items-center justify-center rounded-full', {
    variants: { isSelected: { true: 'bg-positive-action', false: 'bg-surface-disc' } }
});

const codeVariants = cva('text-[13px] font-semibold tracking-[0.3px]', {
    variants: { isSelected: { true: 'text-positive-action-foreground', false: 'text-primary' } }
});

export const LanguageSelectorRow = ({ item, selectedLanguage, onSelect }: Props) => {
    const { t } = useLingui();
    const title = item.nativeName;
    const translatedName = t(item.name);
    const isSelected = item.code === selectedLanguage;
    const subtitle = translatedName === title ? null : translatedName;
    const handleSelect = () => void onSelect(item.code);

    return (
        <SelectorRow
            isSelected={isSelected}
            onPress={handleSelect}
            testID={LanguageSelectorModalSelector.Option(item.code)}
            left={
                <View className={discVariants({ isSelected })} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <Text className={codeVariants({ isSelected })}>{item.code.toUpperCase()}</Text>
                </View>
            }
            title={<SelectorRowTitle text={title} language={item.code} isSelected={isSelected} />}
            subtitle={subtitle}
        />
    );
};
