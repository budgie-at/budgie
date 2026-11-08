import { HouseholdShareStateEnum } from '@budgie/cloud-sync';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { householdAccountShareAtom } from '../../constant/household-account-share-atom.constant';
import { AccountSwitchFieldKindEnum } from '../../enum/account-switch-field-kind.enum';
import { AccountSwitchField } from '../account-switch-field/account-switch-field';

interface Props {
    readonly accountId: number;
    readonly value: boolean | undefined;
    readonly onChange: (value: boolean) => void;
}

export const AccountNetWorthField = ({ accountId, value, onChange }: Props) => {
    const status = AsyncResult.getOrElse(useLiveAtomValue(householdAccountShareAtom(accountId)), () => null);

    if (status?.state === HouseholdShareStateEnum.SHARED_BY_OTHER) {
        return null;
    }

    return <AccountSwitchField kind={AccountSwitchFieldKindEnum.INCLUDE_IN_NET_WORTH} value={value} onChange={onChange} />;
};
