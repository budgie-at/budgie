import { UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';

import { isSelectableAccount } from '../src/account/utils/is-selectable-account.util';

const account = { id: 1, externalId: null, syncZone: 'personal' };
const untracked = { id: 2, externalId: UNTRACKED_OWN_ACCOUNT_EXTERNAL_ID, syncZone: 'personal' };

it('accepts a tracked account when no zone is required', () => {
    expect(isSelectableAccount(account, null, void 0)).toBe(true);
});

it('hides an untracked own account unless it is the current selection', () => {
    expect(isSelectableAccount(untracked, null, void 0)).toBe(false);
    expect(isSelectableAccount(untracked, 2, void 0)).toBe(true);
});

it('requires the zone when one is given', () => {
    expect(isSelectableAccount(account, null, 'personal')).toBe(true);
    expect(isSelectableAccount(account, null, 'household')).toBe(false);
});
