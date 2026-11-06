import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly testID: string;
    readonly icon: UserIconNameEnum;
    readonly variant: ColorPaletteVariant;
    readonly title: string;
    readonly description: string;
    readonly disabled: boolean;
    readonly onPress: () => void;
}

export const ForgotPinRecoveryRow = ({ testID, icon, variant, title, description, disabled, onPress }: Props) => {
    const titleClassName = variant === 'destructive' ? 'text-destructive-foreground text-[17px]' : 'text-primary text-[17px]';
    const pressableProps = { disabled, accessibilityState: { disabled } };

    return (
        <GroupedListRow
            testID={testID}
            left={<CircleIcon icon={icon} variant={variant} size={36} iconSize={18} border={false} />}
            title={<Text className={titleClassName}>{title}</Text>}
            subtitle={<Text className="text-secondary-foreground text-[13px] leading-[18px]">{description}</Text>}
            pressableProps={pressableProps}
            onPress={onPress}
        />
    );
};
