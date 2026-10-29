import { Text } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { TRANSACTION_CARD_META_TEXT_CLASS_NAME } from '../../constant/transaction-card-meta-text-class-name.constant';

export const TransactionCardSeparator = () => (
    <Text
        className={cn(TRANSACTION_CARD_META_TEXT_CLASS_NAME, 'mx-xs shrink-0')}
        accessibilityElementsHidden
        importantForAccessibility="no"
    >
        ·
    </Text>
);
