import type { ZodObject, ZodRawShape, ZodTypeAny } from 'zod';

type AuditKeys = 'id' | 'createdAt' | 'updatedAt' | 'deletedAt';
type WithAuditFields = Partial<Record<AuditKeys, ZodTypeAny>>;

export const convertToCreateEntitySchema = <
  TShape extends ZodRawShape & WithAuditFields
>(entity: ZodObject<TShape>) =>
  entity.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
  });
