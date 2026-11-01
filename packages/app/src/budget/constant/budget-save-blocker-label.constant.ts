import { msg } from '@lingui/core/macro';

export const BUDGET_SAVE_BLOCKER_LABEL = {
    name: msg`Add a name to continue`,
    limit: msg`Set a limit to continue`,
    categoryLimit: msg`Set every category limit to continue`,
    overAllocated: msg`Lower category limits to continue`,
    invalid: msg`Check the form to continue`
} as const;
