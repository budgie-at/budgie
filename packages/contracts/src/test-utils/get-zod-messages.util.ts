import { ZodSafeParseResult } from 'zod';

import { getZodIssues } from './get-zod-issues.util';

export const getZodIssueMessages = (result: ZodSafeParseResult<unknown>) => getZodIssues(result).map(issue => issue.message);
