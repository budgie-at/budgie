import * as Effect from 'effect/Effect';

import { tagRepository } from '../../@generic/drizzle/db/db';

class TagService {
    readonly countTransactions = Effect.fn('TagService.countTransactions')(function* (tagId: number) {
        return yield* tagRepository.countTransactions(tagId);
    });

    readonly mergeInto = Effect.fn('TagService.mergeInto')(function* (fromTagId: number, toTagId: number) {
        yield* tagRepository.reassignTransactions(fromTagId, toTagId);
        yield* tagRepository.deleteById(fromTagId);
    });

    readonly deleteById = Effect.fn('TagService.deleteById')(function* (tagId: number) {
        yield* tagRepository.deleteById(tagId);
    });
}

export const tagService = new TagService();
