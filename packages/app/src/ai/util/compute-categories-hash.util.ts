interface CategoryForHashInterface {
    id: number;
    title: string;
}

/* eslint-disable no-bitwise */
export const computeCategoriesHash = (categories: CategoryForHashInterface[]): string => {
    const sorted = [...categories]
        .sort((first, second) => first.id - second.id)
        .map(category => `${category.id}:${category.title}`)
        .join('|');

    let hash = 0;
    for (let idx = 0; idx < sorted.length; idx += 1) {
        const char = sorted.charCodeAt(idx);
        hash = (hash << 5) - hash + char;
        hash &= hash;
    }

    return hash.toString(36);
};
/* eslint-enable no-bitwise */
