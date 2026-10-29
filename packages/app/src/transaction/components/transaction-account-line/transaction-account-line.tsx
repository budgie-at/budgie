import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { TRANSACTION_CARD_META_TEXT_CLASS_NAME } from '../../constant/transaction-card-meta-text-class-name.constant';

import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly testID: string;
    readonly arrowIcon?: UserIconNameEnum;
}

export const TransactionAccountLine = ({ title, testID, arrowIcon }: Props) => (
    <View className="flex-row items-center gap-x-xxs shrink min-w-0" testID={testID}>
        {isDefined(arrowIcon) ? <Icon icon={arrowIcon} className="text-secondary-foreground" size={12} /> : null}
        <Text
            className={cn(TRANSACTION_CARD_META_TEXT_CLASS_NAME, 'shrink')}
            numberOfLines={1}
            {...testIDProps(testID, TestIDPartEnum.LABEL)}
        >
            {title}
        </Text>
    </View>
);
