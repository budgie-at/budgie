import { stripAmountsFromText } from './strip-amounts-from-text.util';

interface CategoryForPrompt {
    title: string;
}

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const MAX_CATEGORIES = 200;

/* eslint-disable lingui/no-unlocalized-strings -- LLM prompts are not user-facing */
const FEW_SHOT_EXAMPLES: ChatMessage[] = [
    { role: 'user', content: 'Coffee at Starbucks' },
    { role: 'assistant', content: '12' },
    { role: 'user', content: 'Uber' },
    { role: 'assistant', content: '13' },
    { role: 'user', content: 'Bread and milk' },
    { role: 'assistant', content: '11' }
];

export const buildCategorizationPrompt = (text: string, categories: CategoryForPrompt[]): ChatMessage[] => {
    const limitedCategories = categories.slice(0, MAX_CATEGORIES);
    const categoriesWithIds = limitedCategories.map((category, index) => `${index + 1}=${category.title}`).join(', ');

    const systemPrompt = `You categorize expenses. Categories: ${categoriesWithIds}. Reply ONLY with the category number.`;
    const textForCategorization = stripAmountsFromText(text);

    return [{ role: 'system', content: systemPrompt }, ...FEW_SHOT_EXAMPLES, { role: 'user', content: textForCategorization }];
};
/* eslint-enable lingui/no-unlocalized-strings */

export const getLimitedCategories = <T>(categories: T[]): T[] => categories.slice(0, MAX_CATEGORIES);
