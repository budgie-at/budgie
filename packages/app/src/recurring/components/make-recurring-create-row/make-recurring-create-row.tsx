import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { MakeRecurringSheetSelector } from '../make-recurring-sheet/make-recurring-sheet.selector';

interface Props {
    readonly onPress: () => void;
}

export const MakeRecurringCreateRow = ({ onPress }: Props) => {
    const { t } = useLingui();

    return (
        <GroupedListRow
            title={t`Create new recurring payment`}
            left={<CircleIcon size={36} iconSize={18} radius={18} border={false} icon={UserIconNameEnum.Plus} variant="secondary" />}
            onPress={onPress}
            testID={MakeRecurringSheetSelector.CreateRow}
        />
    );
};
