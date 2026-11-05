import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

interface Props {
    readonly transactionId: number;
}

export const TransactionReceiptMarker = ({ transactionId }: Props) => {
    const { t } = useLingui();

    return (
        <View accessible accessibilityLabel={t`Receipt`} testID={TransactionCardSelector.ReceiptMarker(transactionId)}>
            <Icon icon={UserIconNameEnum.Paperclip} size={12} className="text-secondary-foreground" />
        </View>
    );
};
