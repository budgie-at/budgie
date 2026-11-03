import { useLingui } from '@lingui/react/macro';
import { ScrollView, View } from 'react-native';

import { GroupedListSection } from '../@generic/component/grouped-list-section/grouped-list-section';
import { SheetSurface } from '../@generic/component/sheet-surface/sheet-surface';
import { SheetTitleRow } from '../@generic/component/sheet-title-row/sheet-title-row';
import { useModalDismiss } from '../@generic/hook/use-modal-dismiss/use-modal-dismiss.hook';
import { LanguageSelectorRow } from '../i18n/components/language-selector-row/language-selector-row';
import { LANGUAGES } from '../i18n/constant/languages.constant';
import { useLanguageSelectorModal, useLanguageSelectorModalParams } from '../i18n/context/language-selector-modal.context';

export default function LanguageSelectorModal() {
    const { t } = useLingui();
    const [, resolveLanguageSelector, dismissLanguageSelector] = useLanguageSelectorModal();
    useModalDismiss(dismissLanguageSelector);
    const selectedLanguage = useLanguageSelectorModalParams()?.selectedLanguage;

    return (
        <SheetSurface>
            <View className="px-3xl pt-7xl pb-5xl">
                <SheetTitleRow title={t`Language`} />
            </View>
            <ScrollView className="flex-1 px-3xl" contentContainerClassName="pb-safe-or-[16px]">
                <GroupedListSection>
                    {LANGUAGES.map(item => (
                        <LanguageSelectorRow
                            key={item.code}
                            item={item}
                            selectedLanguage={selectedLanguage}
                            onSelect={resolveLanguageSelector}
                        />
                    ))}
                </GroupedListSection>
            </ScrollView>
        </SheetSurface>
    );
}
