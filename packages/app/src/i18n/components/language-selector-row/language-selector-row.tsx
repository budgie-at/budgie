import { useLingui } from '@lingui/react/macro';

import { SelectorCodeDisc } from '../../../@generic/component/selector-code-disc/selector-code-disc';
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
            left={<SelectorCodeDisc code={item.code.toUpperCase()} isSelected={isSelected} />}
            title={<SelectorRowTitle text={title} language={item.code} isSelected={isSelected} />}
            subtitle={subtitle}
        />
    );
};
