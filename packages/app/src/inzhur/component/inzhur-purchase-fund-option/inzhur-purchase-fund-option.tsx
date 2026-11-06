import { useController } from 'react-hook-form';

import { GroupedListCheckRow } from '../../../@generic/component/grouped-list-check-row/grouped-list-check-row';
import { InzhurSelector } from '../../selector/inzhur.selector';

import type { InzhurPurchaseFormValues } from '../../constant/inzhur-purchase-form-schema.constant';

interface Props {
    readonly fundName: string;
}

export const InzhurPurchaseFundOption = ({ fundName }: Props) => {
    const { field } = useController<InzhurPurchaseFormValues, 'fundName'>({ name: 'fundName' });

    const handlePress = () => void field.onChange(fundName);

    return (
        <GroupedListCheckRow
            title={fundName}
            isSelected={field.value === fundName}
            onPress={handlePress}
            testID={InzhurSelector.PurchaseFund(fundName)}
        />
    );
};
