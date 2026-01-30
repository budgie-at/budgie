import { CategoryEntityInterface } from '@budgie/contracts';

export const parseCategorySuggestionResponse = (response: string, categories: Pick<CategoryEntityInterface, 'id'>[]): number | null => {
    const trimmed = response.trim();
    const categoryId = parseInt(trimmed, 10);

    if (isNaN(categoryId) || categoryId === 0) {
        return null;
    }

    const exists = categories.some(category => category.id === categoryId);

    return exists ? categoryId : null;
};
