import { BankIntegrationAccountRow } from '@app/sync/component/bank-integration-account-row/bank-integration-account-row';
import { BinanceSyncService } from '@app/sync/service/binance-sync.service';
import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { PrivatbankSyncService } from '@app/sync/service/privatbank-sync.service';
import { SyncProviderRegistryService } from '@app/sync/service/sync-provider-registry.service';
import {
    AccountAssociationEnum,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    SyncModeEnum,
    SyncStatusEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { beforeEach, describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import { isDefined, isRecord } from '@rnw-community/shared';

import { TestLayer } from '../../harness';

const ACCOUNT_ID = 401;
const INSTRUMENT_ID = 1;

const isToggleCallback = (value: unknown): value is (enabled: boolean) => void => typeof value === 'function';

const rowState = vi.hoisted(() => ({
    capabilities: { supportsLiveSync: true, supportsFileImport: false, supportsAddAccounts: true, supportsDeposit: false },
    syncProvider: 'MONOBANK'
}));

vi.mock('@app/sync/component/bank-integration-account-menu/bank-integration-account-menu', () => ({
    BankIntegrationAccountMenu: () => null
}));

vi.mock('@app/account/query/use-account-balance.query', () => ({
    useAccountBalanceQuery: () => ({ balance: 0 })
}));

vi.mock('@app/i18n/hook/use-display-format-digits.hook', () => ({
    useDisplayFormatDigits: () => () => '0'
}));

vi.mock('@app/sync/hook/use-bank-integration-account-row-state.hook', () => ({
    useBankIntegrationAccountRowState: () => ({
        sync: {
            enabled: true,
            provider: rowState.syncProvider,
            mode: SyncModeEnum.FORWARD,
            status: SyncStatusEnum.IDLE
        },
        switchLabel: rowState.capabilities.supportsFileImport ? 'Include in file imports' : 'Sync',
        description: '',
        isToggleVisible: true
    })
}));

vi.mock('@app/@generic/component/circle-icon/circle-icon', () => ({
    CircleIcon: () => null
}));

vi.mock('@app/@generic/component/protected-text/protected-text', () => ({
    ProtectedText: () => null
}));

vi.mock('@app/@generic/component/simple-horizontal-cell/simple-horizontal-cell', () => ({
    SimpleHorizontalCell: ({ right }: { readonly right?: unknown }) => right
}));

vi.mock('@app/@generic/component/themed-switch/themed-switch', () => ({
    ThemedSwitch: (props: { readonly onValueChange?: (enabled: boolean) => void }) => ({ props })
}));

const findToggleCallback = (node: unknown): ((enabled: boolean) => void) | null => {
    if (!isDefined(node) || typeof node !== 'object') {
        return null;
    }

    if (Array.isArray(node)) {
        for (const child of node) {
            const callback = findToggleCallback(child);

            if (isDefined(callback)) {
                return callback;
            }
        }

        return null;
    }

    if (!isRecord(node) || !isRecord(node['props'])) {
        return null;
    }

    const { props } = node;

    const { onValueChange } = props;

    if (isToggleCallback(onValueChange)) {
        return onValueChange;
    }

    const childrenCallback = findToggleCallback(props['children']);

    if (isDefined(childrenCallback)) {
        return childrenCallback;
    }

    return findToggleCallback(props['right']);
};

const renderRow = () =>
    BankIntegrationAccountRow({
        account: {
            id: ACCOUNT_ID,
            title: 'Binance BTC',
            icon: UserIconNameEnum.Home,
            isActive: true,
            [AccountAssociationEnum.INSTRUMENT]: {
                id: INSTRUMENT_ID,
                createdAt: new Date('2026-01-01T00:00:00.000Z'),
                updatedAt: new Date('2026-01-01T00:00:00.000Z'),
                deletedAt: null,
                type: InstrumentTypeEnum.CRYPTO,
                code: 'BTC',
                name: 'Bitcoin',
                symbol: 'BTC',
                priceProvider: null,
                providerInstrumentId: null,
                marketCapRank: null
            }
        }
    });

const captureToggle = () => {
    const capturedToggle = findToggleCallback(renderRow());

    expect(capturedToggle).not.toBeNull();

    if (!isDefined(capturedToggle)) {
        throw new Error('Bank integration account toggle was not rendered');
    }

    return capturedToggle;
};

describe('BankIntegrationAccountRow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.effect('routes Binance account toggle through the Binance sync service', () =>
        Effect.gen(function* () {
            const syncProviderRegistryService = yield* SyncProviderRegistryService;
            const binanceSyncService = yield* BinanceSyncService;
            const monobankSyncService = yield* MonobankSyncService;
            const binanceSetAccountSyncEnabled = vi.spyOn(binanceSyncService, 'setAccountSyncEnabled').mockReturnValue(Effect.void);
            const monobankSetAccountSyncEnabled = vi.spyOn(monobankSyncService, 'setAccountSyncEnabled').mockReturnValue(Effect.void);
            const getServiceForAccount = vi
                .spyOn(syncProviderRegistryService, 'getServiceForAccount')
                .mockReturnValue(Effect.succeed(binanceSyncService));
            rowState.capabilities = {
                supportsLiveSync: true,
                supportsFileImport: false,
                supportsAddAccounts: false,
                supportsDeposit: false
            };
            rowState.syncProvider = ExternalSourceEnum.BINANCE;

            captureToggle()(false);

            yield* Effect.promise(() =>
                vi.waitFor(() => {
                    expect(binanceSetAccountSyncEnabled).toHaveBeenCalledWith(ACCOUNT_ID, false);
                })
            );
            expect(getServiceForAccount).toHaveBeenCalledWith(ACCOUNT_ID);
            expect(monobankSetAccountSyncEnabled).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('routes file import toggle of a PrivatBank integration through the PrivatBank sync service', () =>
        Effect.gen(function* () {
            const syncProviderRegistryService = yield* SyncProviderRegistryService;
            const privatbankSyncService = yield* PrivatbankSyncService;
            const monobankSyncService = yield* MonobankSyncService;
            const privatbankSetAccountSyncEnabled = vi.spyOn(privatbankSyncService, 'setAccountSyncEnabled').mockReturnValue(Effect.void);
            const monobankSetAccountSyncEnabled = vi.spyOn(monobankSyncService, 'setAccountSyncEnabled').mockReturnValue(Effect.void);
            const getServiceForAccount = vi
                .spyOn(syncProviderRegistryService, 'getServiceForAccount')
                .mockReturnValue(Effect.succeed(privatbankSyncService));
            rowState.capabilities = {
                supportsLiveSync: false,
                supportsFileImport: true,
                supportsAddAccounts: false,
                supportsDeposit: true
            };
            rowState.syncProvider = ExternalSourceEnum.PRIVATBANK;

            captureToggle()(false);

            yield* Effect.promise(() =>
                vi.waitFor(() => {
                    expect(privatbankSetAccountSyncEnabled).toHaveBeenCalledWith(ACCOUNT_ID, false);
                })
            );
            expect(getServiceForAccount).toHaveBeenCalledWith(ACCOUNT_ID);
            expect(monobankSetAccountSyncEnabled).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );
});
