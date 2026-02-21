import { EMBEDDING_CONTEXT_MAX_LENGTH } from '../../@generic/constant/embedding.constant';

export const truncateContext = (context: string): string =>
    context.length > EMBEDDING_CONTEXT_MAX_LENGTH ? context.slice(0, EMBEDDING_CONTEXT_MAX_LENGTH) : context;
