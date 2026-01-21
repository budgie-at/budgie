interface CategoryForPrompt {
    title: string;
}

const MAX_CATEGORIES = 200;

/* eslint-disable lingui/no-unlocalized-strings -- LLM prompts are not user-facing */
const FEW_SHOT_EXAMPLES = [
    { input: 'Coffee at Starbucks', output: '12' },
    { input: 'Uber', output: '13' },
    { input: 'Bread and milk', output: '11' }
];

export const buildSystemPrompt = (categories: CategoryForPrompt[]): string => {
    const limitedCategories = categories.slice(0, MAX_CATEGORIES);
    const categoriesWithIds = limitedCategories.map((category, index) => `${index + 1}=${category.title}`).join(', ');
    const examples = FEW_SHOT_EXAMPLES.map(example => `"${example.input}" -> ${example.output}`).join('; ');

    return `You categorize expenses. Categories: ${categoriesWithIds}. Examples: ${examples}. Reply ONLY with the category number.`;
};
/* eslint-enable lingui/no-unlocalized-strings */

export const getLimitedCategories = <T>(categories: T[]): T[] => categories.slice(0, MAX_CATEGORIES);
