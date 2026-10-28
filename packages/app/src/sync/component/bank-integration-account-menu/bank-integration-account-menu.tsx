import { UserIconNameEnum } from '@budgie/contracts';
import { ExternalAccountService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';

import { emptyFn } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useEffectAction } from '../../../@generic/hook/use-effect-action.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { useArchiveAccount } from '../../../account/hooks/use-archive-account.hook';

interface Props {
    readonly accountId: number;
    readonly rowTestID: string;
}

const TRIGGER_SIZE = 36;
const TRIGGER_ICON_SIZE = 20;

export const BankIntegrationAccountMenu = ({ accountId, rowTestID }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { handleArchive, isLoading } = useArchiveAccount(accountId, emptyFn);
    const [runMarkExternal, isMarkingExternal] = useEffectAction(t`Could not mark account as external`);

    const handleDetails = () => void router.navigate({ pathname: '/account/[id]/details', params: { id: String(accountId) } });
    const handleEdit = () => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(accountId) } });
    const handleArchivePress = () => void handleArchive();
    const handleMarkExternal = async () => {
        const confirmed = await confirmAlert({
            title: t`Mark as External?`,
            message: t`This account will be archived and its transfers will become income and expenses on your other accounts. This cannot be undone.`,
            confirmText: t`Mark External`,
            cancelText: t`Cancel`,
            isDestructive: true
        });

        if (!confirmed) {
            return;
        }

        runMarkExternal(Effect.flatMap(ExternalAccountService, externalAccountService => externalAccountService.markExternal(accountId)));
    };
    const handleExternalPress = () => void handleMarkExternal();

    const isBusy = isLoading || isMarkingExternal;
    const triggerTestID = testID(rowTestID, TestIDPartEnum.MENU).testID;

    return (
        <ActionsMenu
            trigger={
                <CircleIcon
                    icon={UserIconNameEnum.EllipsisVertical}
                    variant="ghost"
                    size={TRIGGER_SIZE}
                    iconSize={TRIGGER_ICON_SIZE}
                    border={false}
                />
            }
            accessibilityLabel={t`Account actions`}
            isDisabled={isBusy}
            triggerClassName="items-center justify-center"
            triggerTestID={triggerTestID}
        >
            <ActionsMenuItem
                icon={UserIconNameEnum.Info}
                label={t`Details`}
                onPress={handleDetails}
                {...testID(rowTestID, TestIDPartEnum.MENU, TestIDPartEnum.DETAILS)}
            />
            <ActionsMenuItem
                icon={UserIconNameEnum.Pencil}
                label={t`Edit`}
                onPress={handleEdit}
                {...testID(rowTestID, TestIDPartEnum.MENU, TestIDPartEnum.EDIT)}
            />
            <ActionsMenuItem
                icon={UserIconNameEnum.ArrowUpRight}
                label={t`External account`}
                onPress={handleExternalPress}
                {...testID(rowTestID, TestIDPartEnum.MENU, TestIDPartEnum.EXTERNAL)}
            />
            <ActionsMenuItem
                icon={UserIconNameEnum.Archive}
                label={t`Archive`}
                onPress={handleArchivePress}
                variant="destructive"
                {...testID(rowTestID, TestIDPartEnum.MENU, TestIDPartEnum.ARCHIVE)}
            />
        </ActionsMenu>
    );
};
