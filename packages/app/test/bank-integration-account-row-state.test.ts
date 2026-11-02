import { expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { DEFAULT_INSTRUMENT } from '../src/settings/constants/default-instrument.constant';
import { useBankIntegrationAccountRowState } from '../src/sync/hook/use-bank-integration-account-row-state.hook';

const state = vi.hoisted(() => ({
    hasSync: true,
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
vi.mock('../src/sync/hook/use-account-sync.hook', () => ({ useAccountSync: () => ({ sync: state.hasSync ? state.sync : null }) }));

it.each([
    [true, false, 'FAILED', false, true, false, 'Sync failed · Connection unavailable', true],
    [true, false, 'FAILED', false, false, false, 'Sync failed · Connection unavailable', true],
    [true, true, 'FAILED', true, false, false, 'Last attempt failed · Connection unavailable', false],
    [true, true, 'SYNCING', true, true, false, '', false],
    [true, true, 'SYNCING', true, false, false, 'Hidden from Home', false],
    [true, false, 'IDLE', false, true, false, 'Sync off', false],
    [true, false, 'IDLE', false, false, false, 'Sync off · Hidden from Home', false],
    [true, false, 'SYNCING', true, false, false, 'Syncing… · Hidden from Home', false],
    [true, false, 'SYNCING', true, true, false, 'Syncing…', false],
    [true, false, 'IDLE', true, true, false, '', false],
    [true, false, 'SYNCING', false, false, true, 'Excluded from imports · Hidden from Home', false],
    [true, false, 'FAILED', false, true, true, 'Sync failed · Connection unavailable', true],
    [false, false, 'IDLE', false, true, false, '', false]
])('row state %s/%s/%s/%s/%s/%s', (hasSync, rejected, status, enabled, active, fileImport, description, failed) => {
    Object.assign(state, { hasSync, isKeyRejected: rejected, supportsLiveSync: !fileImport, supportsFileImport: fileImport });
    Object.assign(state.sync, { status, enabled });
    const title = 'Daily account';
    const result = useBankIntegrationAccountRowState({ id: 1, title, isActive: active, iban: null, instrument: DEFAULT_INSTRUMENT });
    expect(result.description).toBe(description);
    expect(result.isFailed).toBe(failed);
    expect(result.identityLabel).toBe('USD');
    expect(result.hiddenLabel).toBe(status === 'FAILED' && !active ? 'Hidden from Home' : '');
    expect(result.switchLabel).toBe(fileImport ? `Include ${title} in imports` : `Sync ${title}`);
    expect(result.isToggleVisible).toBe(hasSync);
});
