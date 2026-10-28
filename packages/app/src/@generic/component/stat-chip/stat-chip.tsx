import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../icon/icon';
import { ProtectedText } from '../protected-text/protected-text';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly iconClassName: string;
    readonly value: string;
    readonly label?: string;
    readonly testID?: string;
}

export const StatChip = ({ icon, iconClassName, value, label, testID }: Props) => (
    <View
        className="flex-row items-center gap-x-xs rounded-full bg-secondary-background border border-secondary-corner px-md py-xs"
        testID={testID}
    >
        <Icon icon={icon} size={14} className={iconClassName} />
        {isDefined(label) ? <Text className="text-secondary-foreground text-xs">{label}</Text> : null}
        <ProtectedText className="text-primary text-xs font-medium">{value}</ProtectedText>
    </View>
);
