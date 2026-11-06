import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { RecurringFormClearRow } from '../recurring-form-clear-row/recurring-form-clear-row';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';

export const RecurringFormAccountField = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<RecurringSeriesFormValues>();
    const accountId = useWatch({ control, name: 'accountId' });
    const [openAccountSelector] = useAccountSelectorModal();
    const { account } = useGetAccountByIdQuery(accountId ?? 0);
    const hasAccount = isDefined(accountId);

    const handlePress = () => {
        openAccountSelector({ initialAccountId: accountId, onlyActive: false }, selectedAccountId => {
            if (isDefined(selectedAccountId)) {
                setValue('accountId', selectedAccountId);
            }
        });
    };

    const handleClear = () => {
        setValue('accountId', null);
    };

    return (
        <>
            <GroupedListValueRow
                icon={account?.icon ?? UserIconNameEnum.Wallet}
                title={t`Account`}
                value={account?.title ?? t`Any account`}
                testID={RecurringSeriesFormSelector.Account}
                onPress={handlePress}
            />
            {hasAccount ? (
                <RecurringFormClearRow label={t`Use any account`} testID={RecurringSeriesFormSelector.ClearAccount} onPress={handleClear} />
            ) : null}
        </>
    );
};
