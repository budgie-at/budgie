import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useBankIntegrationKeyModal } from '../../context/bank-integration-key-modal.context';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationAccountPreviewsQuery } from '../../query/use-bank-integration-account-previews.query';
import { maskToken } from '../../utils/mask-token.util';

export const BankIntegrationKeyCard = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const [openKeyModal] = useBankIntegrationKeyModal();
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);
    const handlePress = () => void openKeyModal(integration.id);
    const keyLabel = isKeyRejected ? t`Rejected · tap to update` : maskToken(integration.token);
    const keyLabelClassName = isKeyRejected ? 'text-[13px] text-destructive-foreground' : 'text-[13px] font-mono text-secondary-foreground';

    return (
        <GroupedListSection title={t`Connection`} footer={t`Budgie syncs automatically in the background.`}>
            <SettingsRow
                icon={UserIconNameEnum.KeyRound}
                variant="primary"
                title={t`API key`}
                subtitle={
                    <Text className={keyLabelClassName} numberOfLines={1}>
                        {keyLabel}
                    </Text>
                }
                onPress={handlePress}
                testID={BankIntegrationSelector.KeyCard}
            />
        </GroupedListSection>
    );
};
