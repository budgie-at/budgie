import { ZodSafeParseResult } from 'zod';

import { getZodIssues } from './get-zod-issues.util';

export const getZodIssuePaths = (result: ZodSafeParseResult<unknown>) => getZodIssues(result).map(issue => issue.path);
