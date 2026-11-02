import { ExternalSourceEnum, InstrumentTypeEnum, SyncStatusEnum } from '@budgie/contracts';
import { beforeEach, describe, expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { useBankIntegrationAccountRowState } from '../src/sync/hook/use-bank-integration-account-row-state.hook';

const state = vi.hoisted(() => ({
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
vi.mock('../src/sync/hook/use-account-sync.hook', () => ({ useAccountSync: () => state }));

const account = {
    id: 1,
    isActive: true,
    iban: null,
    instrument: {
        id: 1,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        deletedAt: null,
        type: InstrumentTypeEnum.FIAT,
        code: 'UAH',
        name: 'Hryvnia',
        symbol: '₴',
        priceProvider: null,
        providerInstrumentId: null,
        marketCapRank: null
    }
};

describe('bank integration account row state', () => {
    beforeEach(() => {
        state.isKeyRejected = false;
        state.provider = ExternalSourceEnum.MONOBANK;
        state.supportsLiveSync = true;
        state.supportsFileImport = false;
        state.sync.enabled = false;
        state.sync.status = SyncStatusEnum.IDLE;
    });

    it('shows a failed sync reason even with zero errors or a hidden account', () => {
        state.sync.status = SyncStatusEnum.FAILED;
        expect(useBankIntegrationAccountRowState(account).description).toBe('Sync failed · Connection unavailable');
        expect(useBankIntegrationAccountRowState(account).identityLabel).toBe('UAH');
        expect(useBankIntegrationAccountRowState({ ...account, isActive: false }).description).toBe('Sync failed · Connection unavailable');
    });

    it('keeps voluntary pause distinct from failure', () => {
        state.sync.status = SyncStatusEnum.IDLE;
        expect(useBankIntegrationAccountRowState(account).description).toBe('Sync off');
    });
    it('pauses rejected keys before hidden, off and syncing states while keeping the saved preference', () => {
        state.isKeyRejected = true;
        state.sync.status = SyncStatusEnum.SYNCING;
        state.sync.enabled = true;
        expect(useBankIntegrationAccountRowState(account).description).toBe('Paused until the key is updated');
        expect(useBankIntegrationAccountRowState({ ...account, isActive: false }).description).toBe('Paused until the key is updated');
        expect(useBankIntegrationAccountRowState(account).sync?.enabled).toBe(true);
        state.sync.status = SyncStatusEnum.FAILED;
        expect(useBankIntegrationAccountRowState(account).description).toBe('Sync failed · Connection unavailable');
        state.isKeyRejected = false;
    });

    it('keeps identity available when hidden or syncing and has no state line for a healthy account', () => {
        state.sync.status = SyncStatusEnum.SYNCING;
        state.sync.enabled = true;
        expect(useBankIntegrationAccountRowState({ ...account, isActive: false }).description).toBe('Hidden from Home');
        expect(useBankIntegrationAccountRowState(account).description).toBe('Syncing…');
        state.sync.status = SyncStatusEnum.IDLE;
        expect(useBankIntegrationAccountRowState(account).description).toBe('');
        expect(useBankIntegrationAccountRowState(account).identityLabel).toBe('UAH');
    });

    it('keeps file import exclusion below hidden and above syncing', () => {
        state.supportsLiveSync = false;
        state.supportsFileImport = true;
        state.sync.status = SyncStatusEnum.SYNCING;
        expect(useBankIntegrationAccountRowState(account).description).toBe('Excluded from imports');
        expect(useBankIntegrationAccountRowState({ ...account, isActive: false }).description).toBe('Hidden from Home');
        state.sync.status = SyncStatusEnum.FAILED;
        expect(useBankIntegrationAccountRowState(account).description).toBe('Sync failed · Connection unavailable');
    });

    it('omits the duplicated ticker for crypto but keeps account identity for fiat', () => {
        state.provider = ExternalSourceEnum.BINANCE;
        expect(useBankIntegrationAccountRowState(account).identityLabel).toBe('');
        state.provider = ExternalSourceEnum.MONOBANK;
        expect(useBankIntegrationAccountRowState({ ...account, iban: 'UA123456' }).identityLabel).toBe('UAH · ••3456');
    });
});
