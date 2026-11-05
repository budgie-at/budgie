import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

interface Props {
    readonly tone: 'attention' | 'destructive';
    readonly children: string;
}

const placeholderVariants = cva('min-w-0 flex-1 text-right text-[17px] leading-[22px]', {
    variants: {
        tone: { attention: 'text-attention-foreground', destructive: 'text-destructive-strong' }
    }
});

export const TransactionFormRowPlaceholder = ({ tone, children }: Props) => (
    <Text className={placeholderVariants({ tone })} maxFontSizeMultiplier={2} numberOfLines={1}>
        {children}
    </Text>
);
