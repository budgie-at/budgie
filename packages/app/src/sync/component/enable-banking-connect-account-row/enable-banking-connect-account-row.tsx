import { UserIconNameEnum } from '@budgie/contracts';
import { SyncAccountContinuationRefusalEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { Icon } from '../../../@generic/component/icon/icon';
import { getAccountIdentityLabel } from '../../utils/get-account-identity-label.util';

import { EnableBankingConnectAccountRowSelector } from './enable-banking-connect-account-row.selector';

import type { SyncAccountPreviewInterface } from '@budgie/sync';

interface Props {
    readonly preview: Pick<SyncAccountPreviewInterface, 'externalId' | 'title' | 'currencyCode' | 'iban'>;
    readonly refusal: SyncAccountContinuationRefusalEnum | null;
    readonly isSelected: boolean;
    readonly onSelect: (externalId: string) => void;
}

export const EnableBankingConnectAccountRow = ({ preview, refusal, isSelected, onSelect }: Props) => {
    const { t } = useLingui();

    const refusalLabel: Record<SyncAccountContinuationRefusalEnum, string> = {
        [SyncAccountContinuationRefusalEnum.CURRENCY_MISMATCH]: t`Different currency from this account`,
        [SyncAccountContinuationRefusalEnum.IBAN_MISMATCH]: t`Different IBAN from this account`,
        [SyncAccountContinuationRefusalEnum.LINKED_ELSEWHERE]: t`Already linked to another account`,
        [SyncAccountContinuationRefusalEnum.LIVE_SYNC]: t`This account already syncs`
    };
    const subtitle = isDefined(refusal) ? refusalLabel[refusal] : getAccountIdentityLabel(preview.currencyCode, preview.iban);
    const accessory = isSelected ? <Icon icon={UserIconNameEnum.Check} size={20} className="text-primary" /> : <></>;
    const accessibilityState = { selected: isSelected, disabled: isDefined(refusal) };
    const icon = isDefined(refusal) ? UserIconNameEnum.Unlink : UserIconNameEnum.Landmark;

    const handlePress = () => {
        onSelect(preview.externalId);
    };

    return (
        <GroupedListRow
            left={<GroupedListIcon icon={icon} />}
            title={preview.title}
            subtitle={subtitle}
            right={accessory}
            testID={EnableBankingConnectAccountRowSelector.Row(preview.externalId)}
            {...(!isDefined(refusal) && { onPress: handlePress, pressableProps: { accessibilityState } })}
        />
    );
};
