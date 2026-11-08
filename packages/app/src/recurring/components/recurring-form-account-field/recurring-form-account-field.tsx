import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { AnchoredMorphTrigger } from '../../../@generic/component/anchored-morph-trigger/anchored-morph-trigger';
import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { RoundedEdgeEnum } from '../../../@generic/enum/rounded-edge.enum';
import { useAccountSelectorModal } from '../../../account/context/account-selector-modal.context';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

import type { AnchoredMorphOriginInterface } from '../../../@generic/interface/anchored-morph-origin.interface';
import type { RecurringSeriesFormValues } from '../../constant/recurring-series-form-schema.constant';
import type { ComponentProps } from 'react';

export const RecurringFormAccountField = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<RecurringSeriesFormValues>();
    const accountId = useWatch({ control, name: 'accountId' });
    const [openAccountSelector] = useAccountSelectorModal();
    const { account } = useGetAccountByIdQuery(accountId ?? 0);
    const hasAccount = isDefined(accountId);

    const handleSelect = (origin: AnchoredMorphOriginInterface) => {
        openAccountSelector({ initialAccountId: accountId, onlyActive: false, origin }, selectedAccountId => {
            if (isDefined(selectedAccountId)) {
                setValue('accountId', selectedAccountId);
            }
        });
    };

    const handleClear = () => {
        setValue('accountId', null);
    };

    const rowProps: Omit<ComponentProps<typeof GroupedListValueRow>, 'onPress'> = {
        icon: account?.icon ?? UserIconNameEnum.Wallet,
        title: t`Account`,
        value: account?.title ?? t`Any account`,
        testID: RecurringSeriesFormSelector.Account,
        ...(hasAccount && { onClear: handleClear })
    };

    return (
        <AnchoredMorphTrigger edge={RoundedEdgeEnum.BOTTOM} onPress={handleSelect}>
            {handlePress => <GroupedListValueRow {...rowProps} onPress={handlePress} />}
        </AnchoredMorphTrigger>
    );
};
