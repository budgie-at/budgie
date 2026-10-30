import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { isTransactionNoteDuplicated } from '../../utils/is-transaction-note-duplicated.util';
import { TransactionInfoGroup } from '../transaction-info-group/transaction-info-group';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionInfoNoteGroup = ({ transaction }: Props) => {
    if (!isNotEmptyString(transaction.comment) || isTransactionNoteDuplicated(transaction)) {
        return null;
    }

    return (
        <TransactionInfoGroup>
            <View className="flex-row items-start gap-x-xl px-3xl py-xl" testID={TransactionInfoPageSelector.Row.Note}>
                <View className="w-[28px] items-center pt-xxs">
                    <Icon icon={UserIconNameEnum.MessageSquare} size={22} className="text-secondary-foreground" />
                </View>
                <View className="flex-1 min-w-0">
                    <Text className="text-[13px] leading-[18px] text-secondary-foreground">
                        <Trans>Note</Trans>
                    </Text>
                    <Text className="text-[17px] leading-[24px] text-primary" selectable>
                        {transaction.comment}
                    </Text>
                </View>
            </View>
        </TransactionInfoGroup>
    );
};
