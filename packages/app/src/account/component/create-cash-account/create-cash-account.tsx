import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CreateLiabilityAccount } from '../create-liability-account/create-liability-account';

export const CreateCashAccount = () => {
    const { t } = useLingui();

    return <CreateLiabilityAccount type={AccountTypeEnum.CASH} title={t`Savings Account`} />;
};
