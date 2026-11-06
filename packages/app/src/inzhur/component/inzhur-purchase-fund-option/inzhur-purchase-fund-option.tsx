import { useController } from 'react-hook-form';

import { GroupedListCheckRow } from '../../../@generic/component/grouped-list-check-row/grouped-list-check-row';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { InzhurSelector } from '../../selector/inzhur.selector';

import type { InzhurPurchaseFormValues } from '../../constant/inzhur-purchase-form-schema.constant';
import type { InzhurFundOptionInterface } from '../../interface/inzhur-fund-option.interface';

interface Props {
    readonly fund: InzhurFundOptionInterface;
}

export const InzhurPurchaseFundOption = ({ fund }: Props) => {
    const { field } = useController<InzhurPurchaseFormValues, 'fundName'>({ name: 'fundName' });

    const handlePress = () => void field.onChange(fund.name);

    return (
        <GroupedListCheckRow
            left={<NeutralIconTile icon={fund.icon} />}
            title={fund.name}
            isSelected={field.value === fund.name}
            onPress={handlePress}
            testID={InzhurSelector.PurchaseFund(fund.name)}
        />
    );
};
