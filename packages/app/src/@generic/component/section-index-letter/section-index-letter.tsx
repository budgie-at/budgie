import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

interface Props {
    readonly letter: string;
    readonly isActive: boolean;
}

const letterVariants = cva('shrink text-[12px] font-semibold leading-[13px]', {
    variants: {
        isActive: { true: 'font-bold text-positive-action', false: 'text-secondary-foreground' }
    }
});

export const SectionIndexLetter = ({ letter, isActive }: Props) => (
    <Text className={letterVariants({ isActive })} adjustsFontSizeToFit numberOfLines={1}>
        {letter}
    </Text>
);
