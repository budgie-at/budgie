import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { bankIntegrationStatusNowAtom } from '../../constant/bank-integration-status-now-atom.constant';
import { useBankIntegrationKeyModal } from '../../context/bank-integration-key-modal.context';
import { useBankIntegration } from '../../context/bank-integration.context';
import { useBankIntegrationAccountPreviewsQuery } from '../../query/use-bank-integration-account-previews.query';
import { useBankIntegrationSyncsQuery } from '../../query/use-bank-integration-syncs.query';
import { maskToken } from '../../utils/mask-token.util';

export const BankIntegrationKeyCard = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const [openKeyModal] = useBankIntegrationKeyModal();
    const { isKeyRejected } = useBankIntegrationAccountPreviewsQuery(integration.id);
    const syncs = useBankIntegrationSyncsQuery(integration.id);
    const { formatRelativeToNow } = useFormatDate();
    const now = useAtomValue(bankIntegrationStatusNowAtom);
    const lastSyncedAt = syncs
        .map(sync => sync.forwardSyncedAt)
        .filter(isDefined)
        .reduce<Date | null>((latest, date) => (isDefined(latest) && latest >= date ? latest : date), null);
    const relative = isDefined(lastSyncedAt) ? formatRelativeToNow(lastSyncedAt, now) : null;
    const syncFooter = isDefined(relative)
        ? t`Last synced ${relative}. Budgie syncs automatically in the background.`
        : t`Budgie syncs automatically in the background.`;
    const footer = isKeyRejected ? t`Update your API key to resume automatic sync.` : syncFooter;
    const handlePress = () => void openKeyModal(integration.id);
    const keyLabel = isKeyRejected ? t`Rejected · tap to update` : maskToken(integration.token);
    const keyLabelClassName = isKeyRejected ? 'text-[13px] text-destructive-foreground' : 'text-[13px] font-mono text-secondary-foreground';

    return (
        <GroupedListSection title={t`Connection`} footer={footer}>
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
