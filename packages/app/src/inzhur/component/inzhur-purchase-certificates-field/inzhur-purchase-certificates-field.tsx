import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController } from 'react-hook-form';

import { isPositiveNumber } from '@rnw-community/shared';

import { GroupedListInputRow } from '../../../@generic/component/grouped-list-input-row/grouped-list-input-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { InzhurSelector } from '../../selector/inzhur.selector';

import type { InzhurPurchaseFormValues } from '../../constant/inzhur-purchase-form-schema.constant';

export const InzhurPurchaseCertificatesField = () => {
    const { t } = useLingui();
    const { field } = useController<InzhurPurchaseFormValues, 'certificates'>({ name: 'certificates' });

    const value = isPositiveNumber(field.value) ? String(field.value) : '';
    const handleChangeText = (text: string) => void field.onChange(Number(text.replaceAll(/\D/gu, '')));

    return (
        <GroupedListSection title={t`Certificates`}>
            <GroupedListInputRow
                icon={UserIconNameEnum.Hash}
                label={t`Number of certificates`}
                value={value}
                onChangeText={handleChangeText}
                onBlur={field.onBlur}
                placeholder={t`Enter number`}
                keyboardType="number-pad"
                testID={InzhurSelector.PurchaseCertificatesInput}
            />
        </GroupedListSection>
    );
};
