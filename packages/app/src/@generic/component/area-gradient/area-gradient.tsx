import { Defs, LinearGradient, Stop } from 'react-native-svg';
import { useResolveClassNames } from 'uniwind';

interface Props {
    readonly id: string;
    readonly colorClassName: string;
}

export const AreaGradient = ({ id, colorClassName }: Props) => {
    const { backgroundColor } = useResolveClassNames(colorClassName);

    return (
        <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={backgroundColor} stopOpacity={0.28} />
                <Stop offset="1" stopColor={backgroundColor} stopOpacity={0} />
            </LinearGradient>
        </Defs>
    );
};
