import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

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
        <View className="gap-y-xxs px-3xl pt-md">
            {hasDistinctEnglishTitle ? (
                <Text className="text-secondary-foreground text-[13px] leading-[18px]" testID={AiTranslationFieldsSelector.EnglishField}>
                    <Trans>Also found as “{englishTitle}”</Trans>
                </Text>
            ) : null}
            {isNotEmptyString(keywords) ? (
                <Text
                    className="text-secondary-foreground text-[13px] leading-[18px]"
                    accessibilityLabel={t`Search keywords: ${keywords}. Generated automatically so search finds this by other words too.`}
                    testID={AiTranslationFieldsSelector.TagsField}
                >
                    <Trans>Keywords: {keywords} · added automatically for search</Trans>
                </Text>
            ) : null}
        </View>
    );
};
