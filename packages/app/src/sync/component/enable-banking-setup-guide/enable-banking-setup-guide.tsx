import { Trans, useLingui } from '@lingui/react/macro';
import { Linking, Text } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { ENABLE_BANKING_RELAY_URL } from '../../constant/enable-banking-relay-url.constant';
import { EnableBankingCopyValueRow } from '../enable-banking-copy-value-row/enable-banking-copy-value-row';
import { SyncGuideStep } from '../sync-guide-step/sync-guide-step';

const SIGN_IN_URL = 'https://enablebanking.com/sign-in/';
const PRIVACY_URL = 'https://budgie.at/en/legal/privacy-policy';
const TERMS_OF_SERVICE_URL = 'https://budgie.at/en/legal/terms-of-service';
const LABEL_CLASS_NAME = 'font-semibold';

export const EnableBankingSetupGuide = () => {
    const { t } = useLingui();

    const handleOpenSignIn = () => void Linking.openURL(SIGN_IN_URL);

    return (
        <>
            <Text className="text-secondary-foreground px-3xl text-[15px] leading-[20px]">
                {t`Budgie has no server. Requests go from this phone to Enable Banking, which talks to your bank. Your key stays in this phone's secure storage.`}
            </Text>

            <GroupedListSection title={t`Set up once, about 5 minutes`}>
                <SyncGuideStep number={1} onPress={handleOpenSignIn}>
                    <Trans>
                        Open <Text className={LABEL_CLASS_NAME}>Enable Banking</Text> and sign in with the link sent to your email.
                    </Trans>
                </SyncGuideStep>
                <SyncGuideStep number={2}>
                    <Trans>
                        Open <Text className={LABEL_CLASS_NAME}>API applications</Text>, then{' '}
                        <Text className={LABEL_CLASS_NAME}>Add a new application</Text>.
                    </Trans>
                </SyncGuideStep>
                <SyncGuideStep number={3}>
                    <Trans>
                        Set <Text className={LABEL_CLASS_NAME}>Environment</Text> to <Text className={LABEL_CLASS_NAME}>Production</Text>,
                        not Sandbox. Keep the key option on <Text className={LABEL_CLASS_NAME}>Generate in the browser</Text>.
                    </Trans>
                </SyncGuideStep>
            </GroupedListSection>

            <GroupedListSection footer={t`Tap a value to copy it.`}>
                <SyncGuideStep number={4}>
                    <Trans>Enter the values below and your own email for data protection. Every field is required.</Trans>
                </SyncGuideStep>
                <EnableBankingCopyValueRow label={t`Application name`} value={t`Budgie`} />
                <EnableBankingCopyValueRow label={t`Allowed redirect URL`} value={ENABLE_BANKING_RELAY_URL} />
                <EnableBankingCopyValueRow label={t`Description`} value={t`Personal finance tracking`} />
                <EnableBankingCopyValueRow label={t`Privacy URL`} value={PRIVACY_URL} />
                <EnableBankingCopyValueRow label={t`Terms URL`} value={TERMS_OF_SERVICE_URL} />
            </GroupedListSection>

            <GroupedListSection>
                <SyncGuideStep number={5}>
                    <Trans>
                        Tap <Text className={LABEL_CLASS_NAME}>Register</Text>. The key file downloads to Files, in Downloads. Keep it
                        secret.
                    </Trans>
                </SyncGuideStep>
                <SyncGuideStep number={6}>
                    <Trans>
                        On the new application tap <Text className={LABEL_CLASS_NAME}>Activate by linking accounts</Text> and log in to your
                        bank. Use <Text className={LABEL_CLASS_NAME}>Link accounts</Text> for each further bank.
                    </Trans>
                </SyncGuideStep>
            </GroupedListSection>
        </>
    );
};
