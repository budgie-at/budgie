import { BankIntegrationAccountRow } from '@app/sync/component/bank-integration-account-row/bank-integration-account-row';
import {
    AccountAssociationEnum,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    SyncModeEnum,
    SyncStatusEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { describe, expect, it, vi } from 'vitest';

import { isDefined, isRecord } from '@rnw-community/shared';

const ACCOUNT_ID = 401;
const INSTRUMENT_ID = 1;

const isToggleCallback = (value: unknown): value is (enabled: boolean) => void => typeof value === 'function';

const serviceSpies = vi.hoisted(() => ({
    binanceSetAccountSyncEnabled: vi.fn(),
    monobankSetAccountSyncEnabled: vi.fn(),
    getServiceForAccount: vi.fn()
}));

vi.mock('@app/account/query/use-account-balance.query', () => ({
    useAccountBalanceQuery: () => ({ balance: 0 })
}));

vi.mock('@app/i18n/hook/use-display-format-digits.hook', () => ({
    useDisplayFormatDigits: () => () => '0'
}));

vi.mock('@app/sync/hook/use-account-sync.hook', () => ({
    useAccountSync: () => ({
        hasSync: true,
        sync: {
            enabled: true,
            provider: ExternalSourceEnum.BINANCE,
            mode: SyncModeEnum.FORWARD,
            status: SyncStatusEnum.IDLE
        }
    })
}));

vi.mock('@app/sync/service/sync-provider-registry.service', () => ({
    syncProviderRegistryService: {
        getServiceForAccount: serviceSpies.getServiceForAccount
    }
}));

vi.mock('@app/sync/service/monobank-sync.service', () => ({
    monobankSyncService: {
        setAccountSyncEnabled: serviceSpies.monobankSetAccountSyncEnabled
    }
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

describe('BankIntegrationAccountRow', () => {
    it('routes Binance account toggle through the Binance sync service', async () => {
        serviceSpies.getServiceForAccount.mockResolvedValue({
            setAccountSyncEnabled: serviceSpies.binanceSetAccountSyncEnabled
        });

        const element = BankIntegrationAccountRow({
            account: {
                id: ACCOUNT_ID,
                title: 'Binance BTC',
                icon: UserIconNameEnum.Home,
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
            },
            isLiveApi: true
        });

        const capturedToggle = findToggleCallback(element);

        expect(capturedToggle).not.toBeNull();

        if (!isDefined(capturedToggle)) {
            throw new Error('Bank integration account toggle was not rendered');
        }

        capturedToggle(false);
        await Promise.resolve();

        expect(serviceSpies.getServiceForAccount).toHaveBeenCalledWith(ACCOUNT_ID);
        expect(serviceSpies.binanceSetAccountSyncEnabled).toHaveBeenCalledWith(ACCOUNT_ID, false);
        expect(serviceSpies.monobankSetAccountSyncEnabled).not.toHaveBeenCalled();
    });
});
