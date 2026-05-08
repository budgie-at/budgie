import type { BaseOverridesInterface } from '../interface/base-overrides.interface';

export const BaseEntityFields: BaseOverridesInterface = {
    id: schema => schema.describe('The id of the entity.'),
    createdAt: schema => schema.describe('The creation date of the entity.'),
    updatedAt: schema => schema.describe('The last update date of the entity.'),
    deletedAt: schema => schema.describe('The deletion date of the entity (null if not deleted).')
};
