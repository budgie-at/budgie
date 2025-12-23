import { DB } from '../../@generic/type/db.type';
import { processInputWithBatches } from '../../@generic/util/process-input-with-batches.util';
import { CategoryCreateEntityInterface } from '../entity/category-create-entity.interface';
import { CategoryEntityInterface } from '../entity/category-entity.interface';
import { CategoryRepository } from '../repository/category.repository';

export class CategoryService {
    categoryRepository: CategoryRepository;

    constructor(private readonly db: DB) {
        this.categoryRepository = new CategoryRepository(db);
    }

    async bulkCreate(inputs: CategoryCreateEntityInterface[], batchSize = 100): Promise<Record<string, CategoryEntityInterface>> {
        const results = await processInputWithBatches(inputs, batchSize, this.processBatch.bind(this));

        return results.reduce<Record<string, CategoryEntityInterface>>((acc, category) => ({ ...acc, [category.title]: category }), {});
    }

    private async processBatch(batch: CategoryCreateEntityInterface[]): Promise<CategoryEntityInterface[]> {
        return await this.db.transaction(async tx => this.categoryRepository.bulkCreate(batch, tx));
    }
}
