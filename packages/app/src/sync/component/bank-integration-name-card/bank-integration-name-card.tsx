import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { SettingsCard } from '../../../settings/components/settings-card/settings-card';
import { useBankIntegrationNameModal } from '../../context/bank-integration-name-modal.context';
import { useBankIntegration } from '../../context/bank-integration.context';

export const BankIntegrationNameCard = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const [openNameModal] = useBankIntegrationNameModal();

    const description = integration.label ?? t`Not set`;
    const handlePress = () => void openNameModal(integration.id);

    return (
        <SettingsCard
            icon={UserIconNameEnum.Tag}
            title={t`Name`}
            description={description}
            onPress={handlePress}
            testID={BankIntegrationSelector.NameCard}
        />
    );
};
