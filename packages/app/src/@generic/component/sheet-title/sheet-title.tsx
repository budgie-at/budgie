import { Text } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly title: string;
    readonly className?: string;
}

export const SheetTitle = ({ title, className }: Props) => (
    <Text
        accessibilityRole="header"
        className={cn('text-primary px-xl pt-xl pb-lg text-center text-[17px] leading-[22px] font-semibold', className)}
    >
        {title}
    </Text>
);
