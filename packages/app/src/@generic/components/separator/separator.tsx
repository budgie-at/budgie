import { LinearGradient } from 'expo-linear-gradient';
import { styled } from 'nativewind';

const Gradient = styled(LinearGradient);

const colors = ['rgba(255,255,255,0.40)', 'rgba(0,0,0,0)'] as const;
const start = { x: 0, y: 0 } as const;
const end = { x: 1, y: 0 } as const;

export const Separator = () => <Gradient className="h-[2px] w-[100px]" colors={colors} start={start} end={end} />;
