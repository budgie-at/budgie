import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useGetAccountsByIntegrationIdQuery } from '../../../account/query/use-get-accounts-by-integration-id.query';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { EXTERNAL_SOURCE } from '../../../rule/constant/external-source.constant';
import { SettingsRow } from '../../../settings/components/settings-row/settings-row';
import { useBankIntegration } from '../../context/bank-integration.context';

export const BankIntegrationStatements = () => {
    const { t } = useLingui();
    const { integration } = useBankIntegration();
    const { accounts } = useGetAccountsByIntegrationIdQuery(integration.id);
    const bank = t(EXTERNAL_SOURCE[integration.provider]);
    const subtitle =
        isDefined(accounts) && isEmptyArray(accounts)
            ? t`Import a ${bank} statement to add your accounts`
            : t`PDF or spreadsheet from ${bank}`;
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
