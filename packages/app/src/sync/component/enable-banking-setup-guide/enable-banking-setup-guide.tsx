import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Linking, Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ENABLE_BANKING_RELAY_URL } from '../../constant/enable-banking-relay-url.constant';
import { NumberedSteps } from '../numbered-steps/numbered-steps';

const CONTROL_PANEL_URL = 'https://enablebanking.com/cp/applications';
const TERMS_URL = 'https://enablebanking.com/terms';

export const EnableBankingSetupGuide = () => {
    const { t } = useLingui();

    const steps = [
        t`Sign in to the Enable Banking control panel as yourself and register an application`,
        t`Set the redirect URL of the application to the address shown below, exactly`,
        t`Save the .pem key file the application gives you`,
        t`Link each of your own accounts to the application`
    ];

    const handleOpenControlPanel = () => void Linking.openURL(CONTROL_PANEL_URL);
    const handleOpenTerms = () => void Linking.openURL(TERMS_URL);

    return (
        <>
            <SimpleHorizontalCell
                left={<CircleIcon icon={UserIconNameEnum.Info} variant="warning" size={15} iconSize={15} />}
                size="lg"
                variant="warning"
                title={t`Budgie has no server. Requests go from this phone to Enable Banking, which talks to your bank. Your key stays in this phone's secure storage.`}
            />

            <NumberedSteps title={t`Set up once`} steps={steps} />

            <GroupedListSection
                title={t`Redirect URL`}
                footer={t`Personal accounts only. Enable Banking's Terms allow this for private individuals using their own accounts. By connecting you accept them.`}
            >
                <GroupedListRow
                    title={
                        <Text className="text-primary text-[15px]" selectable>
                            {ENABLE_BANKING_RELAY_URL}
                        </Text>
                    }
                />
                <GroupedListRow title={t`Open Enable Banking`} onPress={handleOpenControlPanel} />
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
