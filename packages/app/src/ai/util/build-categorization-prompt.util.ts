interface CategoryForPrompt {
    title: string;
}

const MAX_CATEGORIES = 200;

/* eslint-disable lingui/no-unlocalized-strings -- LLM prompts are not user-facing */
const JSON_EXAMPLES = [
    { input: 'Coffee at Starbucks for 5 dollars', output: '{"categoryId":12,"amount":5,"currency":"USD"}' },
    { input: 'Uber 15 euros', output: '{"categoryId":13,"amount":15,"currency":"EUR"}' },
    { input: 'Bread and milk 50', output: '{"categoryId":11,"amount":50}' }
];

export const buildSystemPrompt = (categories: CategoryForPrompt[]): string => {
    const limitedCategories = categories.slice(0, MAX_CATEGORIES);
    const categoriesWithIds = limitedCategories.map((category, index) => `${index + 1}=${category.title}`).join(', ');
    const examples = JSON_EXAMPLES.map(example => `"${example.input}" -> ${example.output}`).join('; ');

    return `You parse expenses into JSON. Categories: ${categoriesWithIds}. Output format: {"categoryId":N,"amount":X,"currency":"CUR"}. Currency is optional 3-letter ISO code. Examples: ${examples}. Reply ONLY with valid JSON.`;
};
/* eslint-enable lingui/no-unlocalized-strings */

export const getLimitedCategories = <T>(categories: T[]): T[] => categories.slice(0, MAX_CATEGORIES);
