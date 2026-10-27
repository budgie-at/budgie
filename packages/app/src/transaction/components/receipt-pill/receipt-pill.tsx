import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { MetaPill } from '../../../@generic/component/meta-pill/meta-pill';

interface Props {
    readonly testID: string;
}

export const ReceiptPill = ({ testID }: Props) => {
    const { t } = useLingui();

    return <MetaPill icon={UserIconNameEnum.Receipt} label={t`Receipt`} testID={testID} />;
};
