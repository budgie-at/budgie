import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../grouped-list-section/grouped-list-section';

import { AiTranslationFieldsSelector } from './ai-translation-fields.selector';

interface Props {
    readonly title: string;
    readonly titleEn: string | null;
    readonly titleTags: string | null;
}

export const AiTranslationFields = ({ title, titleEn, titleTags }: Props) => {
    const { t } = useLingui();
    const keywords = (titleTags ?? '')
        .split(',')
        .map(keyword => keyword.trim())
        .filter(isNotEmptyString)
        .join(', ');
    const englishTitle = titleEn?.trim() ?? '';
    const hasDistinctEnglishTitle = isNotEmptyString(englishTitle) && englishTitle.toLowerCase() !== title.trim().toLowerCase();

    if (!hasDistinctEnglishTitle && !isNotEmptyString(keywords)) {
        return null;
    }

    return (
        <GroupedListSection title={t`Search keywords`} footer={t`Generated automatically so search finds this by other words too.`}>
            {hasDistinctEnglishTitle ? (
                <GroupedListRow title={t`English`} subtitle={englishTitle} testID={AiTranslationFieldsSelector.EnglishField} />
            ) : null}
            {isNotEmptyString(keywords) ? (
                <GroupedListRow title={t`Keywords`} subtitle={keywords} testID={AiTranslationFieldsSelector.TagsField} />
            ) : null}
        </GroupedListSection>
    );
};
