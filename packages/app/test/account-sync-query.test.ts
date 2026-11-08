import { expect, it } from '@effect/vitest';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { vi } from 'vitest';

import { useGetAccountSync } from '../src/sync/query/use-get-account-sync.query';

const read = vi.hoisted(() => vi.fn());

vi.mock('../src/@generic/hook/use-live-atom-value.hook', () => ({ useLiveAtomValue: read }));
vi.mock('../src/@generic/utils/database-query-family.util', () => ({ databaseQueryFamily: () => (accountId: number) => accountId }));

it('only blocks the adjustment screen during the initial sync read', () => {
    read.mockReturnValue(AsyncResult.initial());
    expect(useGetAccountSync(1)).toEqual({ sync: null, isLoading: true });
    read.mockReturnValue(AsyncResult.success(null));
    expect(useGetAccountSync(1)).toEqual({ sync: null, isLoading: false });
});

it('allows the adjustment screen to render when the sync read fails', () => {
    read.mockReturnValue(AsyncResult.fail('Sync read failed'));
    expect(useGetAccountSync(1)).toEqual({ sync: null, isLoading: false });
});
