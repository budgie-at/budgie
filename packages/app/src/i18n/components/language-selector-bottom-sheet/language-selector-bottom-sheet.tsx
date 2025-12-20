import { LanguageEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';

import { SearchableSelectorBottomSheet } from '../../../@generic/components/searchable-selector-bottom-sheet/searchable-selector-bottom-sheet';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { LANGUAGES } from '../../constant/languages.constant';
import { LanguageInterface } from '../../interface/language.interface';

interface Props {
    readonly language: LanguageEnum;
    readonly onSelect: (language: LanguageEnum) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const getItemKey = (item: LanguageInterface) => item.code;

export const LanguageSelectorBottomSheet = ({ ref, language, onSelect }: Props) => {
    const { t } = useLingui();

    return (
        <SearchableSelectorBottomSheet
            ref={ref}
            selectedValue={language}
            onSelect={onSelect}
            data={LANGUAGES}
            title={t`Select Language`}
            description={t`Choose your preferred language for date and number formatting`}
            searchPlaceholder={t`Search languages...`}
            emptyTitle={t`No languages found`}
            emptyDescription={t`Try a different search term`}
            getItemKey={getItemKey}
            getItemCode={getItemKey}
        />
    );
};
