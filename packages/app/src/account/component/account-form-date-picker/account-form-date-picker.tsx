import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { usePickDate } from '../../../@generic/hook/use-pick-date.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly date: Date | null;
    readonly testID?: string;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (date: Date) => void;
}

export const AccountFormDatePicker = ({ date, onChange, testID, variant }: Props) => {
    const { formatDayAndFullMonthAndYear } = useFormatDate();
    const pickDate = usePickDate();
    const { t } = useLingui();

    const handleOpen = () => {
        pickDate(date ?? new Date(), selectedDate => {
            onChange(selectedDate);
        });
    };

    const description = isDefined(date) ? t`Expected return date` : t`When should it be returned?`;
    const title = isDefined(date) ? formatDayAndFullMonthAndYear(date) : t`Set Return Date`;

    return (
        <SimpleHorizontalCell
            left={<CircleIcon icon={UserIconNameEnum.Calendar} variant={variant} />}
            onPress={handleOpen}
            title={title}
            description={description}
            singleLine
            testID={testID}
        />
    );
};
