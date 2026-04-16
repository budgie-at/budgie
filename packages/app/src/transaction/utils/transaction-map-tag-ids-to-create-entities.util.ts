export const transactionMapTagIdsToCreateEntities = (tagIds: number[], transactionId: number) =>
    tagIds.map(tagId => ({ transactionId, tagId }));
