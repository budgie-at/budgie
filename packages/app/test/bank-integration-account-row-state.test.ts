import { SyncStatusEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { useBankIntegrationAccountRowState } from '../src/sync/hook/use-bank-integration-account-row-state.hook';

const state = vi.hoisted(() => ({
    sync: { enabled: false, status: 'FAILED', lastError: 'Connection unavailable', errorCount: 0 }
}));

vi.mock('@lingui/react/macro', () => ({ useLingui: () => ({ t: (strings: TemplateStringsArray) => strings.join('') }) }));
vi.mock('../src/sync/context/bank-integration.context', () => ({
    useBankIntegration: () => ({ capabilities: { supportsLiveSync: true, supportsFileImport: false } })
}));
vi.mock('../src/sync/hook/use-account-sync.hook', () => ({ useAccountSync: () => state }));

describe('bank integration account row state', () => {
    it('shows a failed sync reason even with zero errors or a hidden account', () => {
        state.sync.status = SyncStatusEnum.FAILED;
        expect(useBankIntegrationAccountRowState({ id: 1, isActive: true }).description).toBe('Sync Failed: Connection unavailable');
        expect(useBankIntegrationAccountRowState({ id: 1, isActive: false }).description).toBe('Sync Failed: Connection unavailable');
    });

    it('keeps voluntary pause distinct from failure', () => {
        state.sync.status = SyncStatusEnum.IDLE;
        expect(useBankIntegrationAccountRowState({ id: 1, isActive: true }).description).toBe('Sync paused');
    });
});
