import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../grouped-list-section/grouped-list-section';

import { AiTranslationFieldsSelector } from './ai-translation-fields.selector';

interface Props {
    readonly titleEn: string | null;
    readonly titleTags: string | null;
    readonly isRegenerating: boolean;
    readonly onTitleEnPress: () => void;
    readonly onTitleTagsPress: () => void;
}

export const AiTranslationFields = ({ titleEn, titleTags, isRegenerating, onTitleEnPress, onTitleTagsPress }: Props) => {
    const { t } = useLingui();
    const keywords = titleTags
        ?.split(',')
        .map(keyword => keyword.trim())
        .join(', ');

    if (isRegenerating) {
        return (
            <GroupedListSection title={t`Search keywords`}>
                <GroupedListRow left={<ActivityIndicator size="small" />} title={t`Generating keywords…`} />
            </GroupedListSection>
        );
    }

    if (!isDefined(titleEn) && !isDefined(titleTags)) {
        return null;
    }

    return (
        <GroupedListSection title={t`Search keywords`} footer={t`Generated automatically so search finds this by other words too.`}>
            {isDefined(titleEn) ? (
                <GroupedListRow
                    title={t`English`}
                    subtitle={titleEn}
                    onPress={onTitleEnPress}
                    testID={AiTranslationFieldsSelector.EnglishField}
                />
            ) : null}
            {isDefined(titleTags) ? (
                <GroupedListRow
                    title={t`Keywords`}
                    subtitle={keywords}
                    onPress={onTitleTagsPress}
                    testID={AiTranslationFieldsSelector.TagsField}
                />
            ) : null}
        </GroupedListSection>
    );
};
