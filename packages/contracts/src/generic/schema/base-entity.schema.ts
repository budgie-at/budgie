import { date, number, object } from 'zod';

export const BaseEntitySchema = object({
    id: number().positive().describe('Unique identifier of the entity.'),
    createdAt: date().describe('Date of creation of the entity.'),
    updatedAt: date().describe('Date of last update of the entity.'),
    deletedAt: date().nullable().describe('Date of deletion (archiving) of the entity.')
});
