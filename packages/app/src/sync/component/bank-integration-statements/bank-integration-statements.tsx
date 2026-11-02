import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { EXTERNAL_SOURCE } from '../../../rule/constant/external-source.constant';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useBankIntegration } from '../../context/bank-integration.context';

export const BankIntegrationStatements = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const bank = t(EXTERNAL_SOURCE[integration.provider]);
    const subtitle = t`PDF or spreadsheet from ${bank}`;
    const handleImportFile = () => void router.push({ pathname: '/create-account/[type]', params: { type: integration.provider } });

    return (
        <GroupedListSection title={t`Statements`}>
            <SettingsRow
                icon={UserIconNameEnum.FileSpreadsheet}
                variant="primary"
                title={t`Import statement`}
                subtitle={subtitle}
                onPress={handleImportFile}
                testID={BankIntegrationSelector.ImportFileButton}
            />
        </GroupedListSection>
    );
};
