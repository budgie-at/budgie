import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SheetSurface } from '../../../@generic/component/sheet-surface/sheet-surface';
import { SheetTitleRow } from '../../../@generic/component/sheet-title-row/sheet-title-row';
import { useMorphingSheetCommit } from '../../../@generic/hook/use-morphing-sheet-commit.hook';
import { LANGUAGES } from '../../constant/languages.constant';
import { LanguageSelectorRow } from '../language-selector-row/language-selector-row';

import type { LanguageEnum } from '@budgie/contracts';

interface Props {
    readonly selectedLanguage: LanguageEnum | undefined;
    readonly onCommit: (language: LanguageEnum) => void;
}

export const LanguageSelectorModalContent = ({ selectedLanguage, onCommit }: Props) => {
    const { t } = useLingui();
    const commit = useMorphingSheetCommit(onCommit);

    return (
        <SheetSurface className="flex-none pt-lg" contentClassName="flex-none">
            <View className="px-xl pb-lg">
                <SheetTitleRow title={t`Language`} />
            </View>
            <View className="px-3xl pb-xl">
                <GroupedListSection>
                    {LANGUAGES.map(item => (
                        <LanguageSelectorRow key={item.code} item={item} selectedLanguage={selectedLanguage} onSelect={commit} />
                    ))}
                </GroupedListSection>
            </View>
        </SheetSurface>
    );
};
