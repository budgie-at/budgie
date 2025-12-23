import { EmptyFn, isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { HorizontalCell } from '../horizontal-cell/horizontal-cell';

interface Props {
    readonly title?: string;
    readonly onPress: EmptyFn;
    readonly date: Date | null;
    readonly description?: string;
    readonly variant: ColorPaletteVariant;
}

export const DatePickerCard = ({ variant, onPress, date, title, description }: Props) => {
    const { formatDayAndFullMonthAndYear } = useFormatDate();

    const cardTitle = isDefined(date) ? formatDayAndFullMonthAndYear(date) : title;
    const titleVariant = isDefined(date) ? 'primary' : 'secondary';

    return (
        <HorizontalCell
            titleVariant={titleVariant}
            onPress={onPress}
            variant={variant}
            title={cardTitle}
            description={description}
            icon="Calendar"
        />
    );
};
