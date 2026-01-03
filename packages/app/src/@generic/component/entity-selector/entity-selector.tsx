import { UserIconNameEnum } from '@budgie/contracts';

import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { FormFieldStatus } from '../../type/form-field-status.type';
import { SimpleHorizontalCell } from '../simple-horizontal-cell/simple-horizontal-cell';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly iconVariant?: ColorPaletteVariant;
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly status?: FormFieldStatus;
    readonly description?: string;
    readonly onPress: () => void;
}

export const EntitySelector = (props: Props) => {
    const { variant, iconVariant, icon, title, description, onPress, status = 'default' } = props;

    const cardVariant = status === 'error' ? 'destructive' : 'primary';
    const iconParams = { variant: iconVariant ?? variant, size: 38, iconSize: 18 };

    return (
        <SimpleHorizontalCell
            variant={cardVariant}
            title={title}
            description={description}
            icon={icon}
            onPress={onPress}
            iconParams={iconParams}
        />
    );
};
