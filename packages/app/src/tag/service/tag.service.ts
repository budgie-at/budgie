import { Db, TagRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isNotEmptyString } from '@rnw-community/shared';

import type { TagCreateEntityInterface } from '@budgie/contracts';

export class TagService extends Context.Service<TagService>()('@budgie/app/TagService', {
    make: Effect.gen(function* () {
        const tagRepository = yield* TagRepository;

        const saveTranslation = Effect.fnUntraced(function* (tagId: number, titleEn: string | null, titleTags: string | null) {
            if (isNotEmptyString(titleEn) && isNotEmptyString(titleTags)) {
                yield* tagRepository.updateTranslation(tagId, titleEn, titleTags);
            } else {
                yield* tagRepository.clearTranslation(tagId);
            }
        });

        return {
            countTransactions: (tagId: number) => tagRepository.countTransactions(tagId),
            create: Effect.fn('TagService.create')(
                function* (input: TagCreateEntityInterface, titleEn: string | null, titleTags: string | null) {
                    const tag = yield* tagRepository.create(input);
                    yield* saveTranslation(tag.id, titleEn, titleTags);

                    return tag;
                },
                effect => Db.transaction(effect)
            ),
            update: Effect.fn('TagService.update')(
                function* (tagId: number, input: TagCreateEntityInterface, titleEn: string | null, titleTags: string | null) {
                    const updatedTag = yield* tagRepository.updateById(tagId, input);
                    yield* saveTranslation(tagId, titleEn, titleTags);
                    const savedTags = yield* tagRepository.findByIds([tagId]);

                    return savedTags.at(0) ?? updatedTag;
                },
                effect => Db.transaction(effect)
            ),
            mergeInto: Effect.fn('TagService.mergeInto')(
                function* (fromTagId: number, toTagId: number) {
                    const targetTags = yield* tagRepository.findByIds([toTagId]);
                    yield* tagRepository.reassignTransactions(fromTagId, toTagId);
                    yield* tagRepository.deleteById(fromTagId);

                    return targetTags.at(0) ?? null;
                },
                effect => Db.transaction(effect)
            ),
            deleteById: (tagId: number) => tagRepository.deleteById(tagId)
        };
    })
}) {
    static readonly layer = Layer.effect(TagService, TagService.make).pipe(Layer.provide(TagRepository.layer));
}
