import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { isDefined } from '@rnw-community/shared';

import { HeaderTextAction } from '../../../@generic/component/header-text-action/header-text-action';
import { TransactionInfoPageSelector } from '../transaction-info-page/transaction-info-page.selector';

import type { Href } from 'expo-router';

interface Props {
    readonly editHref: Href | null;
}

export const TransactionInfoEditButton = ({ editHref }: Props) => {
    const router = useRouter();
    const { t } = useLingui();

    if (!isDefined(editHref)) {
        return null;
    }

    const handleEditPress = () => void router.push(editHref);

    return (
        <HeaderTextAction
            label={t`Edit`}
            onPress={handleEditPress}
            testID={TransactionInfoPageSelector.EditButton}
            labelTestID={TransactionInfoPageSelector.EditButtonLabel}
        />
    );
};
