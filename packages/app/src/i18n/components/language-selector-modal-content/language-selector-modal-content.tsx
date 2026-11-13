import { useLingui } from '@lingui/react/macro';

import { SelectorSheetList } from '../../../@generic/component/selector-sheet-list/selector-sheet-list';
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
        <SelectorSheetList title={t`Language`}>
            {LANGUAGES.map(item => (
                <LanguageSelectorRow key={item.code} item={item} selectedLanguage={selectedLanguage} onSelect={commit} />
            ))}
        </SelectorSheetList>
    );
};
