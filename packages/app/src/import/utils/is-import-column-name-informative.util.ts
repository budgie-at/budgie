export const isImportColumnNameInformative = (header: string, label: string): boolean => {
    const normalizedHeader = header.toLowerCase().replaceAll(/[^\p{L}\p{N}]/gu, '');
    const normalizedLabel = label.toLowerCase().replaceAll(/[^\p{L}\p{N}]/gu, '');
    const lastWord = label
        .trim()
        .split(/\s+/u)
        .at(-1)
        ?.toLowerCase()
        .replaceAll(/[^\p{L}\p{N}]/gu, '');

    return normalizedHeader !== normalizedLabel && normalizedHeader !== lastWord;
};
