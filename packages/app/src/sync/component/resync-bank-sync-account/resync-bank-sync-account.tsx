import { UserIconNameEnum } from '@budgie/contracts';

import { Button } from '../../../@generic/component/button/button';
import { useResyncWindowPickerModal } from '../../context/resync-window-picker-modal.context';

import type { ResyncBankSyncAccountPropsInterface } from '../../interface/resync-bank-sync-account-props.interface';

export const ResyncBankSyncAccount = ({ accountId }: ResyncBankSyncAccountPropsInterface) => {
    const [openResyncWindowPicker] = useResyncWindowPickerModal();

    const handleResync = () => {
        void openResyncWindowPicker({ accountId });
    };

    return <Button onPress={handleResync} size="sm" variant="positive" leftIcon={UserIconNameEnum.RotateCw} />;
};
