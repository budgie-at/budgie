import { isNotEmptyString } from '@rnw-community/shared';

export const matchesRecurringTitle = (title: string, description: string): boolean =>
    isNotEmptyString(title) && ` ${description} `.includes(` ${title} `);
