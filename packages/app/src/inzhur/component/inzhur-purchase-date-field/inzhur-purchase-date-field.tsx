import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';

import type { InzhurPurchaseFormValues } from '../../constant/inzhur-purchase-form-schema.constant';

export const InzhurPurchaseDateField = () => {
    const { t } = useLingui();
    const { field } = useController<InzhurPurchaseFormValues, 'operatedAt'>({ name: 'operatedAt' });
    const { formatDayAndFullMonthAndYear } = useFormatDate();
    const openDatePicker = useOpenModal('/date-picker');

    const handleOpen = () =>
        void openDatePicker({ initialDate: field.value }, selectedDate => {
            if (isDefined(selectedDate)) {
                field.onChange(selectedDate);
            }
        });

    return (
        <GroupedListSection>
            <GroupedListValueRow
                icon={UserIconNameEnum.Calendar}
                title={t`Date`}
                value={formatDayAndFullMonthAndYear(field.value)}
                onPress={handleOpen}
                testID={InzhurSelector.PurchaseDateButton}
            />
        </GroupedListSection>
    );
};
