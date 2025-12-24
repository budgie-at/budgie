import { useLingui } from '@lingui/react/macro';
import { RefObject } from 'react';

import { SearchableSelectorBottomSheet } from '../../../@generic/component/searchable-selector-bottom-sheet/searchable-selector-bottom-sheet';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { LOCALES, LocaleInfoWithDetailsInterface } from '../../constant/locales.constant';

interface Props {
    readonly locale: string;
    readonly onSelect: (locale: string) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const getItemKey = (item: LocaleInfoWithDetailsInterface) => item.languageTag;

export const LocaleSelectorBottomSheet = ({ ref, locale, onSelect }: Props) => {
    const { t } = useLingui();

    return (
        <SearchableSelectorBottomSheet
            ref={ref}
            selectedValue={locale}
            onSelect={onSelect}
            data={LOCALES}
            title={t`Select Locale`}
            description={t`Choose your preferred locale for date and number formatting`}
            searchPlaceholder={t`Search locales...`}
            emptyTitle={t`No locales found`}
            emptyDescription={t`Try a different search term`}
            getItemKey={getItemKey}
            getItemCode={getItemKey}
        />
    );
};
