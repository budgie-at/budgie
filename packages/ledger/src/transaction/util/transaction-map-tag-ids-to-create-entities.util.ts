import { TagSourceEnum } from '@budgie/contracts';

import type { TransactionCreateInputInterface, TransactionTagsCreateEntityInterface } from '@budgie/contracts';

export const transactionMapTagIdsToCreateEntities = (
    input: Pick<TransactionCreateInputInterface, 'tagIds' | 'ruleTagIds'>,
    transactionId: number,
    preservedSourceByTagId: ReadonlyMap<number, TagSourceEnum> = new Map()
): TransactionTagsCreateEntityInterface[] => {
    const userTagIds = new Set(input.tagIds);
    const ruleOnlyTagIds = new Set((input.ruleTagIds ?? []).filter(tagId => !userTagIds.has(tagId)));
    const [primaryTagId] = [...userTagIds, ...ruleOnlyTagIds];

    return [...userTagIds, ...ruleOnlyTagIds].map(tagId => ({
        transactionId,
        tagId,
        isPrimary: tagId === primaryTagId,
        source: ruleOnlyTagIds.has(tagId) ? TagSourceEnum.RULE : (preservedSourceByTagId.get(tagId) ?? TagSourceEnum.USER)
    }));
};
