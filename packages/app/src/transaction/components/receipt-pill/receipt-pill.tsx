import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { TransactionMetaPill } from '../transaction-meta-pill/transaction-meta-pill';

interface Props {
    readonly testID: string;
}

export const ReceiptPill = ({ testID }: Props) => {
    const { t } = useLingui();

    return <TransactionMetaPill icon={UserIconNameEnum.Receipt} label={t`Receipt`} testID={testID} />;
};
