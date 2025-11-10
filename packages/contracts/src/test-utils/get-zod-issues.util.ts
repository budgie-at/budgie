import { ZodSafeParseResult } from 'zod';

export const getZodIssues = (result: ZodSafeParseResult<unknown>) => (result.success ? [] : result.error.issues);
