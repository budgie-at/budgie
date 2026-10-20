import type { WalletCaptureNativeRecordInterface } from '@app/wallet-capture/interface/wallet-capture-native-record.interface';
import type { AppIntentEntity, AppIntentInvocation } from 'expo-app-intents';

const walletCaptureInvocation = ({ captureId, capturedAt, ...params }: WalletCaptureNativeRecordInterface): AppIntentInvocation => ({
    id: captureId,
    name: 'captureApplePayTransaction',
    params,
    createdAt: Date.parse(capturedAt)
});

class WalletCaptureAppIntentsStub {
    private invocations: AppIntentInvocation[] = [];
    private catalogs = new Map<string, AppIntentEntity[]>();

    getPendingInvocationsAsync = async (): Promise<AppIntentInvocation[]> => [...this.invocations];

    removePendingInvocationAsync = async (id: string): Promise<void> => {
        this.invocations = this.invocations.filter(invocation => invocation.id !== id);
    };

    setEntityCatalogAsync = async (kind: string, entities: AppIntentEntity[]): Promise<void> => {
        this.catalogs.set(kind, [...entities]);
    };

    seed(records: readonly WalletCaptureNativeRecordInterface[]): void {
        this.seedInvocations(records.map(walletCaptureInvocation));
    }

    seedInvocations(invocations: readonly AppIntentInvocation[]): void {
        this.invocations = [...invocations];
    }

    pendingCaptureIds(): string[] {
        return this.invocations.map(invocation => invocation.id);
    }

    getCatalog(kind: string): AppIntentEntity[] {
        return this.catalogs.get(kind) ?? [];
    }

    reset(): void {
        this.invocations = [];
        this.catalogs = new Map();
    }
}

export const walletCaptureNativeStub = new WalletCaptureAppIntentsStub();
