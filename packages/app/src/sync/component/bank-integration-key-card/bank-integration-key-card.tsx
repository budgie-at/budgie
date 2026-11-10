import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationAccountPreviewsQuery } from '../../query/use-bank-integration-account-previews.query';
import { maskToken } from '../../utils/mask-token.util';

export const BankIntegrationKeyCard = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const openKeyModal = useOpenModal('/bank-integration-key');
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);
    const footer = isKeyRejected ? null : t`Budgie syncs automatically and lists new Monobank accounts here as soon as they appear.`;
    const handlePress = () => void openKeyModal(integration.id);
    const keyLabel = isKeyRejected ? t`Rejected · tap to update` : maskToken(integration.token);
    const keyLabelClassName = isKeyRejected ? 'text-[13px] text-destructive-strong' : 'text-[13px] font-mono text-secondary-foreground';

    return (
        <GroupedListSection title={t`Connection`} footer={footer}>
            <SettingsRow
                icon={UserIconNameEnum.KeyRound}
                variant="secondary"
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
