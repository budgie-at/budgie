import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { BankIntegrationSelector } from '../../../app/(main)/bank-integration/bank-integration.selector';
import { EXTERNAL_SOURCE } from '../../../rule/constant/external-source.constant';
import { useBankIntegration } from '../../context/bank-integration.context';

export const BankIntegrationEmptyAccounts = () => {
    const { t } = useLingui();
    const { integration, capabilities } = useBankIntegration();
    const bank = t(EXTERNAL_SOURCE[integration.provider]);
    const description = capabilities.supportsFileImport
        ? t`Import a statement from ${bank} to add your accounts.`
        : t`Accounts you sync appear here.`;

    return (
        <GroupedListRow
            title={t`No accounts yet`}
            subtitle={description}
            left={
                <CircleIcon
                    icon={UserIconNameEnum.Wallet}
                    size={36}
                    iconSize={18}
                    variant="primary"
                    border={false}
                    className={TONAL_DISC_BACKGROUND.primary}
                />
            }
            testID={BankIntegrationSelector.EmptyState}
        />
    );
};
