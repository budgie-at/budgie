import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';

export const CreateMoreBanksCard = () => {
    const { t } = useLingui();

    const handleNavigate = () => void router.push('/create-account/banks');

    return (
        <GroupedListRow
            testID={CreateAccountSelector.MoreBanks}
            left={<BankLogo bankProvider={ExternalSourceEnum.ENABLE_BANKING} size={36} />}
            title={t`2,000+ EU banks`}
            subtitle={t`Search banks connected through Enable Banking`}
            onPress={handleNavigate}
        />
    );
};
