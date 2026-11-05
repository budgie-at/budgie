export const SYNC_LOCAL_ONLY_PROPERTIES: Readonly<Record<string, readonly string[]>> = {
    accounts: ['titleSearch', 'contactId'],
    bank_integrations: ['token', 'historyProgress'],
    categories: ['titleSearch', 'titleEn', 'titleTags', 'tagsGeneratedAt'],
    tags: ['titleSearch', 'titleEn', 'titleTags', 'tagsGeneratedAt'],
    transactions: ['needsEmbedding']
};
