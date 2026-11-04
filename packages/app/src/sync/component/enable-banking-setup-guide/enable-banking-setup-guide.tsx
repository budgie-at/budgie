import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Linking, Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ENABLE_BANKING_RELAY_URL } from '../../constant/enable-banking-relay-url.constant';
import { EnableBankingCopyValueRow } from '../enable-banking-copy-value-row/enable-banking-copy-value-row';
import { NumberedSteps } from '../numbered-steps/numbered-steps';

const SIGN_IN_URL = 'https://enablebanking.com/sign-in/';
const TERMS_URL = 'https://enablebanking.com/terms';
const PRIVACY_URL = 'https://budgie.at/en/legal/privacy-policy';
const TERMS_OF_SERVICE_URL = 'https://budgie.at/en/legal/terms-of-service';

export const EnableBankingSetupGuide = () => {
    const { t } = useLingui();

    const steps = [
        t`Open Enable Banking below and sign in with the link sent to your email.`,
        t`Open API applications, then Add a new application.`,
        t`Set Environment to Production (it defaults to Sandbox, which only reaches test banks). Leave the key option on Generate in the browser.`,
        t`Fill in every field with the values below. All are required for Production.`,
        t`Tap Register. The key file downloads to your Files app, in Downloads. Keep it secret and do not send it to anyone.`,
        t`On the new application tap Activate by linking accounts and log in to your bank. Use Link accounts for each further bank.`
    ];

    const handleOpenSignIn = () => void Linking.openURL(SIGN_IN_URL);
    const handleOpenTerms = () => void Linking.openURL(TERMS_URL);

    return (
        <>
            <SimpleHorizontalCell
                left={<CircleIcon icon={UserIconNameEnum.Info} variant="warning" size={15} iconSize={15} />}
                size="lg"
                variant="warning"
                title={t`Budgie has no server. Requests go from this phone to Enable Banking, which talks to your bank. Your key stays in this phone's secure storage.`}
            />

            <NumberedSteps title={t`Set up once, about 5 minutes`} steps={steps} />

            <GroupedListSection
                title={t`Values for step 4`}
                footer={t`Email for data protection: use your own email. Tap a value to copy it.`}
            >
                <EnableBankingCopyValueRow label={t`Application name`} value={t`Budgie`} />
                <EnableBankingCopyValueRow label={t`Allowed redirect URL`} value={ENABLE_BANKING_RELAY_URL} />
                <EnableBankingCopyValueRow label={t`Description`} value={t`Personal finance tracking`} />
                <EnableBankingCopyValueRow label={t`Privacy URL`} value={PRIVACY_URL} />
                <EnableBankingCopyValueRow label={t`Terms URL`} value={TERMS_OF_SERVICE_URL} />
            </GroupedListSection>

            <GroupedListSection
                footer={t`Personal accounts only. Enable Banking's Terms allow this for private individuals using their own accounts. By connecting you accept them.`}
            >
                <GroupedListRow title={t`Open Enable Banking`} onPress={handleOpenSignIn} />
                <GroupedListRow
                    title={
                        <Text className="text-primary text-[17px]">
                            <Trans>Read the Enable Banking Terms</Trans>
                        </Text>
                    }
                    onPress={handleOpenTerms}
                />
            </GroupedListSection>
        </>
    );
};
