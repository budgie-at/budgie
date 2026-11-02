import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { GroupedListSection } from '../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedSurface } from '../@generic/component/grouped-surface/grouped-surface';
import { SelectorRowTitle } from '../@generic/component/selector-row-title/selector-row-title';
import { SelectorRow } from '../@generic/component/selector-row/selector-row';
import { SheetTitleRow } from '../@generic/component/sheet-title-row/sheet-title-row';
import { GroupedSurfacePaletteEnum } from '../@generic/enum/grouped-surface-palette.enum';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { LANGUAGES } from '../i18n/constant/languages.constant';
import { useLanguageSelectorModal, useLanguageSelectorModalParams } from '../i18n/context/language-selector-modal.context';
import { LanguageInterface } from '../i18n/interface/language.interface';

import { LanguageSelectorModalSelector } from './language-selector-modal.selector';

const discVariants = cva('h-[36px] w-[36px] items-center justify-center rounded-full', {
    variants: { isSelected: { true: 'bg-positive-action', false: 'bg-surface-disc' } }
});

const codeVariants = cva('text-[13px] font-semibold tracking-[0.3px]', {
    variants: { isSelected: { true: 'text-positive-action-foreground', false: 'text-primary' } }
});

export default function LanguageSelectorModal() {
    const { t } = useLingui();
    const [, resolveLanguageSelector, dismissLanguageSelector] = useLanguageSelectorModal();
    useModalDismiss(dismissLanguageSelector);
    const selectedLanguage = useLanguageSelectorModalParams()?.selectedLanguage;

    const languages = [...LANGUAGES].sort((first, second) => t(first.nativeName).localeCompare(t(second.nativeName)));

    const renderLanguage = (item: LanguageInterface) => {
        const title = t(item.nativeName);
        const translatedName = t(item.name);
        const isSelected = item.code === selectedLanguage;
        const subtitle = isSelected ? null : translatedName;
        const handleSelect = () => void resolveLanguageSelector(item.code);

        return (
            <SelectorRow
                key={item.code}
                isSelected={isSelected}
                onPress={handleSelect}
                testID={LanguageSelectorModalSelector.Option(item.code)}
                left={
                    <View
                        className={discVariants({ isSelected })}
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                    >
                        <Text className={codeVariants({ isSelected })}>{item.code.toUpperCase()}</Text>
                    </View>
                }
                title={<SelectorRowTitle text={title} language={item.code} isSelected={isSelected} />}
                subtitle={subtitle}
            />
        );
    };

    return (
        <GroupedSurface palette={GroupedSurfacePaletteEnum.SHEET} className="flex-none">
            <View className="px-3xl pt-7xl pb-5xl">
                <SheetTitleRow title={t`Language`} />
            </View>
            <View className="px-3xl">
                <GroupedListSection>{languages.map(renderLanguage)}</GroupedListSection>
            </View>
        </GroupedSurface>
    );
}
