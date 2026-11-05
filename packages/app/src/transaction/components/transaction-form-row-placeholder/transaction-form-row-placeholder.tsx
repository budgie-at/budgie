import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { TransactionFormRowPlaceholderToneEnum } from '../../enum/transaction-form-row-placeholder-tone.enum';

interface Props {
    readonly tone: TransactionFormRowPlaceholderToneEnum;
    readonly children: string;
}

const placeholderVariants = cva('min-w-0 flex-1 text-right text-[17px] leading-[22px]', {
    variants: {
        tone: {
            [TransactionFormRowPlaceholderToneEnum.ATTENTION]: 'text-attention-foreground',
            [TransactionFormRowPlaceholderToneEnum.DESTRUCTIVE]: 'text-destructive-strong'
        }
    }
});

export const TransactionFormRowPlaceholder = ({ tone, children }: Props) => (
    <Text className={placeholderVariants({ tone })} maxFontSizeMultiplier={2} numberOfLines={1}>
        {children}
    </Text>
);
