import { buildContextParts } from './build-context-parts.util';

export const buildCommentContext = (comment: string): string => buildContextParts([{ label: 'Transaction', value: comment }]);
