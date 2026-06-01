import { UserIconNameEnum } from '@budgie/contracts';

import { Button } from '../../../@generic/component/button/button';
import { useResyncWindowPickerModal } from '../../context/resync-window-picker-modal.context';

interface Props {
    readonly accountId: number;
}

export const ResyncBankSyncAccount = ({ accountId }: Props) => {
    const [openResyncWindowPicker] = useResyncWindowPickerModal();

    const handleResync = () => {
        void openResyncWindowPicker({ accountId });
    };

    return <Button onPress={handleResync} size="sm" variant="positive" leftIcon={UserIconNameEnum.RotateCw} />;
};
