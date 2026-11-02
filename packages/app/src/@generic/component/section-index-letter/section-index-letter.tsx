import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

interface Props {
    readonly letter: string;
    readonly isActive: boolean;
    readonly isScrubbing: boolean;
}

const letterVariants = cva('text-[12px] font-semibold leading-[13px]', {
    variants: {
        isActive: { true: 'font-bold text-positive-action', false: '' },
        isScrubbing: { true: '', false: '' }
    },
    compoundVariants: [
        { isActive: false, isScrubbing: false, className: 'text-secondary-foreground' },
        { isActive: false, isScrubbing: true, className: 'text-secondary-foreground/60' }
    ]
});

export const SectionIndexLetter = ({ letter, isActive, isScrubbing }: Props) => (
    <Text className={letterVariants({ isActive, isScrubbing })}>{letter}</Text>
);
