import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';

import { cn } from '../../utils/cn.util';

interface Props {
    className?: string;
}

const Gradient = styled(LinearGradient);

const colors = ['rgba(255,255,255,0.40)', 'rgba(0,0,0,0)'] as const;

export const Separator = ({ className }: Props) => <Gradient className={cn('h-[2px] w-[100px]', className)} colors={colors} />;
