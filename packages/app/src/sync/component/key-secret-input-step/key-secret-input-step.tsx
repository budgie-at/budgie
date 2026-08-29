import { ExternalSourceEnum } from '@budgie/contracts';

import { BinanceSyncTokenInputs } from '../binance-sync-token-inputs/binance-sync-token-inputs';
import { SyncCredentialsStepHeader } from '../sync-credentials-step-header/sync-credentials-step-header';

interface Props {
    readonly apiKey: string;
    readonly apiSecret: string;
    readonly onApiKeyChange: (apiKey: string) => void;
    readonly onApiSecretChange: (apiSecret: string) => void;
}

export const KeySecretInputStep = ({ apiKey, apiSecret, onApiKeyChange, onApiSecretChange }: Props) => (
    <>
        <SyncCredentialsStepHeader provider={ExternalSourceEnum.BINANCE} />

        <BinanceSyncTokenInputs
            apiKey={apiKey}
            apiSecret={apiSecret}
            onApiKeyChange={onApiKeyChange}
            onApiSecretChange={onApiSecretChange}
        />
    </>
);
