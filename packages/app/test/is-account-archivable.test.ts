import { HouseholdShareStateEnum } from '@budgie/cloud-sync';
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { vi } from 'vitest';

import { isAccountArchivable } from '../src/account/utils/is-account-archivable.util';

vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));

describe('account archive ownership', () => {
    it('blocks an unresolved share status', () => {
        expect(isAccountArchivable(AsyncResult.initial())).toBe(false);
    });

    it.each([
        [HouseholdShareStateEnum.PRIVATE, true],
        [HouseholdShareStateEnum.SHARED_BY_ME, true],
        [HouseholdShareStateEnum.SHARED_BY_OTHER, false]
    ])('maps %s to %s', (state, expected) => {
        expect(isAccountArchivable(AsyncResult.success({ state }))).toBe(expected);
    });

    it('preserves archiving after a failed share read', () => {
        expect(isAccountArchivable(AsyncResult.failure(Cause.fail('read failed')))).toBe(true);
    });
});
