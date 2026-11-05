import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SyncCredentialRow } from '../sync-credential-row/sync-credential-row';
import { SyncCredentialsStepHeader } from '../sync-credentials-step-header/sync-credentials-step-header';
import { SyncTokenSectionSelector } from '../sync-token-section/sync-token-section.selector';

interface Props {
    readonly apiKey: string;
    readonly apiSecret: string;
    readonly onApiKeyChange: (apiKey: string) => void;
    readonly onApiSecretChange: (apiSecret: string) => void;
}

export const KeySecretInputStep = ({ apiKey, apiSecret, onApiKeyChange, onApiSecretChange }: Props) => {
    const { t } = useLingui();

    return (
        <>
            <SyncCredentialsStepHeader provider={ExternalSourceEnum.BINANCE} />

            <GroupedListSection>
                <SyncCredentialRow
                    icon={UserIconNameEnum.KeyRound}
                    title={t`API key`}
                    value={apiKey}
                    onChangeText={onApiKeyChange}
                    placeholder={t`Enter your Binance API key`}
                    secureTextEntry
                    testID={SyncTokenSectionSelector.BinanceApiKeyInput}
                />
                <SyncCredentialRow
                    icon={UserIconNameEnum.Lock}
                    title={t`API secret`}
                    value={apiSecret}
                    onChangeText={onApiSecretChange}
                    placeholder={t`Enter your Binance API secret`}
                    secureTextEntry
                    testID={SyncTokenSectionSelector.BinanceApiSecretInput}
                />
            </GroupedListSection>
        </>
    );
};
