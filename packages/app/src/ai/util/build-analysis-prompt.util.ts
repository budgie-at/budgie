import { LanguageEnum } from '@budgie/contracts';

interface CategoryForAnalysisInterface {
    id: number;
    title: string;
}

/* eslint-disable lingui/no-unlocalized-strings */
const LANGUAGE_NAMES: Record<LanguageEnum, string> = {
    [LanguageEnum.EN]: 'English',
    [LanguageEnum.FR]: 'French',
    [LanguageEnum.UK]: 'Ukrainian',
    [LanguageEnum.DE]: 'German',
    [LanguageEnum.ES]: 'Spanish'
};

export const buildAnalysisPrompt = (categories: CategoryForAnalysisInterface[], language: LanguageEnum): string => {
    const categoryList = categories.map(category => `${category.id}. ${category.title}`).join('\n');
    const languageName = LANGUAGE_NAMES[language];

    return `Analyze expense categories. Create type mappings.

Categories:
${categoryList}

For each category create:
- type: short English word (lowercase)
- categoryId: the category number
- keywords: 3-5 words in ${languageName} that match this category

Output JSON array only:
[{"type":"x","categoryId":1,"keywords":["a","b","c"]}]`;
};
/* eslint-enable lingui/no-unlocalized-strings */
