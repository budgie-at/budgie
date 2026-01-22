interface CategoryForHashInterface {
    id: number;
    title: string;
}

export const computeCategoriesHash = (categories: CategoryForHashInterface[]): string => {
    const sorted = [...categories]
        .sort((a, b) => a.id - b.id)
        .map(c => `${c.id}:${c.title}`)
        .join('|');

    let hash = 0;
    for (let i = 0; i < sorted.length; i += 1) {
        const char = sorted.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash &= hash;
    }

    return hash.toString(36);
};
