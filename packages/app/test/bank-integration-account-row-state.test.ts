import { expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { DEFAULT_INSTRUMENT } from '../src/settings/constants/default-instrument.constant';
import { useBankIntegrationAccountRowState } from '../src/sync/hook/use-bank-integration-account-row-state.hook';

const state = vi.hoisted(() => ({
    hasSync: true,
    allSyncOff: false,
    isKeyRejected: false,
    provider: 'MONOBANK',
    supportsLiveSync: true,
    supportsFileImport: false,
    sync: { enabled: false, status: 'FAILED', lastError: 'Connection unavailable', errorCount: 0 }
}));

vi.mock('@lingui/react/macro', () => ({
    useLingui: () => ({
        t: (strings: TemplateStringsArray, ...values: string[]) =>
            strings.reduce((result, part, index) => result + part + (values[index] ?? ''), '')
    })
}));
vi.mock('../src/sync/context/bank-integration.context', () => ({
    useBankIntegration: () => ({
        integration: { provider: state.provider },
        capabilities: { supportsLiveSync: state.supportsLiveSync, supportsFileImport: state.supportsFileImport }
    })
}));
vi.mock('../src/sync/query/use-bank-integration-account-previews.query', () => ({
    useBankIntegrationAccountPreviewsQuery: () => ({ isKeyRejected: state.isKeyRejected })
}));
vi.mock('../src/sync/query/use-bank-integration-syncs.query', () => ({
    useBankIntegrationSyncsQuery: () => [state.sync, { enabled: !state.allSyncOff, status: 'IDLE' }]
}));
vi.mock('../src/sync/hook/use-account-sync.hook', () => ({ useAccountSync: () => ({ sync: state.hasSync ? state.sync : null }) }));

it.each([
    [false, false, 'FAILED', true, true, false, 'USD', true],
    [false, false, 'FAILED', false, true, false, 'Sync off', true],
    [false, false, 'FAILED', true, false, false, 'Hidden from Home', true],
    [false, true, 'FAILED', false, false, false, 'Hidden from Home', true],
    [false, true, 'SYNCING', true, true, false, 'USD', false],
    [false, true, 'IDLE', false, false, false, 'Hidden from Home', false],
    [false, false, 'IDLE', false, true, false, 'Sync off', false],
    [true, false, 'IDLE', false, true, false, 'USD', false],
    [true, false, 'IDLE', false, false, false, 'Hidden from Home', false],
    [false, false, 'SYNCING', true, false, false, 'Syncing… · Hidden from Home', false],
    [false, false, 'SYNCING', true, true, false, 'Syncing…', false],
    [false, false, 'IDLE', true, true, false, 'USD', false],
    [false, false, 'IDLE', false, false, true, 'Imports off · Hidden from Home', false],
    [false, false, 'FAILED', false, true, true, 'Imports off', true]
])('row subtitle %s/%s/%s/%s/%s/%s', (allSyncOff, rejected, status, enabled, active, fileImport, subtitle, failed) => {
    Object.assign(state, { allSyncOff, isKeyRejected: rejected, supportsLiveSync: !fileImport, supportsFileImport: fileImport });
    Object.assign(state.sync, { status, enabled });
    const title = 'Daily account';
    const result = useBankIntegrationAccountRowState({ id: 1, title, isActive: active, iban: null, instrument: DEFAULT_INSTRUMENT });
    expect(result.leadLabel).toBe(subtitle);
    expect(result.isFailed).toBe(failed);
    expect(result.switchLabel).toBe(fileImport ? `Include ${title} in imports` : `Sync ${title}`);
    expect(result.isToggleVisible).toBe(true);
});

it.each(['MONOBANK', 'BINANCE'])('identity without sync for %s', provider => {
    Object.assign(state, { provider, hasSync: false, isKeyRejected: false });
    const result = useBankIntegrationAccountRowState({
        id: 1,
        title: 'Account',
        isActive: true,
        iban: null,
        instrument: DEFAULT_INSTRUMENT
    });
    expect(result.leadLabel).toBe(provider === 'BINANCE' ? '' : 'USD');
    expect(result.isToggleVisible).toBe(false);
});
