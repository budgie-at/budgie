import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { SyncImportProgress } from '../../../sync/component/sync-import-progress/sync-import-progress';
import { BANK_PROVIDER_TITLE } from '../../constant/bank-provider-title.constant';
import { getBankIntegrationTitle } from '../../utils/get-bank-integration-title.util';
import { AccountSectionHeaderFrame } from '../account-section-header-frame/account-section-header-frame';

import { BankProviderSectionHeaderSelector } from './bank-provider-section-header.selector';

import type { InitialSyncProgressInterface } from '@budgie/sync';

interface Props {
    readonly provider: ExternalSourceEnum;
    readonly integrationId: number;
    readonly label: string | null;
    readonly groupNumber: number | null;
    readonly total: number;
    readonly importProgress: InitialSyncProgressInterface | null;
}

export const BankProviderSectionHeader = ({ provider, integrationId, label, groupNumber, total, importProgress }: Props) => {
    const { t } = useLingui();

    const titleDescriptor = BANK_PROVIDER_TITLE[provider];
    const providerTitle = isDefined(titleDescriptor) ? t(titleDescriptor) : provider;
    const title = getBankIntegrationTitle(providerTitle, label, groupNumber);

    const footer = isDefined(importProgress) ? <SyncImportProgress progress={importProgress} /> : null;

    const handleOpenIntegrationSettings = () =>
        void router.push({ pathname: '/bank-integration/[id]', params: { id: String(integrationId) } });

    return (
        <AccountSectionHeaderFrame
            title={title}
            total={total}
            footer={footer}
            leading={<BankLogo bankProvider={provider} size={22} />}
            trailing={
                <HapticPressable
                    className="size-[28px] items-center justify-center rounded-full active:bg-surface-fill"
                    hitSlop={8}
                    onPress={handleOpenIntegrationSettings}
                    accessibilityRole="button"
                    accessibilityLabel={t`Bank integration settings`}
                    testID={BankProviderSectionHeaderSelector.SettingsButton(integrationId)}
                >
                    <Icon className="text-secondary-foreground" icon={UserIconNameEnum.Settings} size={16} />
                </HapticPressable>
            }
        />
    );
};
