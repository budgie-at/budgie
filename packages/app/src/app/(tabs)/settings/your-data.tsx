import { useLingui } from '@lingui/react/macro';
import { ScrollView } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { Page } from '../../../@generic/component/page/page';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { ExportDatabase } from '../../../export/components/export-database/export-database';
import { useI18nContext } from '../../../i18n/context/i18n.context';
import { OnboardingReceiptCard } from '../../../onboarding/component/onboarding-receipt-card/onboarding-receipt-card';
import { useOnboardingReceiptRows } from '../../../onboarding/hook/use-onboarding-receipt-rows.hook';
import { PinCard } from '../../../settings/components/security-settings/pin-card';
import { SettingsGroup } from '../../../settings/components/settings-group/settings-group';
import { TruncateData } from '../../../settings/components/truncate-data/truncate-data';
import { YourDataFileCard } from '../../../settings/components/your-data-file-card/your-data-file-card';
import { YourDataLocalItems } from '../../../settings/components/your-data-local-items/your-data-local-items';
import { useSetting } from '../../../settings/hook/use-setting.hook';

import { YourDataPageSelector } from './your-data-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function YourDataPage() {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const lastBackupAt = useSetting('lastBackupAt');
    const fileRows = useOnboardingReceiptRows();

    const lastBackupLabel = isDefined(lastBackupAt)
        ? intl.formatDate(lastBackupAt, { day: 'numeric', month: 'short', year: 'numeric' })
        : t`Never`;
    const lastBackupVariant = isDefined(lastBackupAt) ? 'primary' : 'warning';
    const receiptRows = [...fileRows, { label: t`Last backup`, value: lastBackupLabel, valueVariant: lastBackupVariant }] as const;

    return (
        <Page testID={YourDataPageSelector.Page} header={<PageHeader title={t`Your data`} onGoBack={handleGoBack} />}>
            <ScrollView className="flex-1" contentContainerClassName="gap-y-7xl pb-5xl pt-3xl" showsVerticalScrollIndicator={false}>
                <SettingsGroup title={t`The file`}>
                    <YourDataFileCard />
                    <OnboardingReceiptCard rows={receiptRows} />
                    <ExportDatabase testID={YourDataPageSelector.ExportCard} />
                </SettingsGroup>

                <YourDataLocalItems />

                <SettingsGroup title={t`Key`}>
                    <PinCard />
                    <TruncateData />
                </SettingsGroup>
            </ScrollView>
        </Page>
    );
}
