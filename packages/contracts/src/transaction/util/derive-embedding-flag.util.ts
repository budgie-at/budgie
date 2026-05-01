import { isDefined } from '@rnw-community/shared';

import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import type { TransactionCreateEntityInterface } from '../entity/transaction-create-entity.interface';
import type { TransactionUpdateInputInterface } from '../input/transaction-update-input.interface';

const EMBEDDING_SEMANTIC_FIELDS = [
    'title',
    'comment',
    'type',
    'fromAccountId',
    'toAccountId'
] as const satisfies readonly (keyof TransactionCreateEntityInterface)[];

const NON_INDEXABLE_TYPES: readonly TransactionTypeEnum[] = [TransactionTypeEnum.TRANSFER, TransactionTypeEnum.ADJUSTMENT];

type EmbeddingFlagPatch = Partial<Pick<TransactionCreateEntityInterface, 'needsEmbedding'>>;

export const deriveEmbeddingFlag = (input: TransactionUpdateInputInterface): EmbeddingFlagPatch => {
    if ('needsEmbedding' in input) {
        return {};
    }

    if (isDefined(input.type) && NON_INDEXABLE_TYPES.includes(input.type)) {
        return { needsEmbedding: false };
    }

    const touchesSemantic = EMBEDDING_SEMANTIC_FIELDS.some(field => field in input);

    return touchesSemantic ? { needsEmbedding: true } : {};
};
