import { Text, View } from 'react-native';

interface Props {
    readonly name: string;
}

const TILE_STYLE = { width: 36, height: 36, borderRadius: 10, borderCurve: 'continuous' } as const;

export const EnableBankingBankLogo = ({ name }: Props) => (
    <View className="items-center justify-center bg-surface-disc" style={TILE_STYLE}>
        <Text className="text-[17px] font-semibold text-primary">{name.trim().charAt(0).toLocaleUpperCase()}</Text>
    </View>
);
