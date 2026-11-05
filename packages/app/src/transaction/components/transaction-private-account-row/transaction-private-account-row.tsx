import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { privateAccountOwnerAtom } from '../../constant/private-account-owner-atom.constant';
import { TransactionInfoRow } from '../transaction-info-row/transaction-info-row';

interface Props {
    readonly label: string;
    readonly syncZone: string;
    readonly syncId: string;
    readonly testID: string;
}

export const TransactionPrivateAccountRow = ({ label, syncZone, syncId, testID }: Props) => {
    const { t } = useLingui();
    const ownerName = AsyncResult.getOrElse(
        useLiveAtomValue(privateAccountOwnerAtom({ syncZone, syncId })),
        (): string | null => null
    );
    const value = isDefined(ownerName) ? t`Private account of ${ownerName}` : t`Private account`;

    return <TransactionInfoRow icon={UserIconNameEnum.Lock} label={label} value={value} testID={testID} />;
};
