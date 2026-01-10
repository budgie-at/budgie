import { tagRepository } from '../../@generic/drizzle/db/db';

class TagService {
    async countTransactions(tagId: number): Promise<number> {
        return tagRepository.countTransactions(tagId);
    }

    async mergeInto(fromTagId: number, toTagId: number): Promise<void> {
        await tagRepository.reassignTransactions(fromTagId, toTagId);
        await tagRepository.deleteById(fromTagId);
    }

    async deleteWithReassignment(tagId: number, reassignToTagId: number): Promise<void> {
        await tagRepository.reassignTransactions(tagId, reassignToTagId);
        await tagRepository.deleteById(tagId);
    }

    async deleteById(tagId: number): Promise<void> {
        await tagRepository.deleteById(tagId);
    }
}

export const tagService = new TagService();
