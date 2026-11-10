import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';

interface Props {
    readonly accountId: number;
    readonly subtitle: string;
    readonly testID?: string;
}

export const ResyncAccount = ({ accountId, subtitle, testID }: Props) => {
    const { t } = useLingui();
    const openResyncWindowPicker = useOpenModal('/resync-window-picker');

    const handleResync = () => {
        openResyncWindowPicker({ accountId });
    };

    return (
        <GroupedListRow
            left={
                <CircleIcon
                    icon={UserIconNameEnum.History}
                    variant="secondary"
                    size={36}
                    iconSize={18}
                    radius={18}
                    border={false}
                    className="bg-surface-disc"
                />
            }
            title={t`Sync past transactions`}
            subtitle={subtitle}
            testID={testID}
            onPress={handleResync}
        />
    );
};
