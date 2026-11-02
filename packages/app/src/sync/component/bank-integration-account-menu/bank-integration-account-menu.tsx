import { UserIconNameEnum } from '@budgie/contracts';
import { ExternalAccountService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useRouter } from 'expo-router';

import { emptyFn } from '@rnw-community/shared';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { useArchiveAccount } from '../../../account/hooks/use-archive-account.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly accountId: number;
    readonly rowTestID: string;
    readonly accountTitle: string;
    readonly children: ReactNode;
}

export const BankIntegrationAccountMenu = ({ accountId, rowTestID, accountTitle, children }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { handleArchive, isLoading } = useArchiveAccount(accountId, emptyFn);
    const { isLoading: isMarkingExternal, run: runMarkExternal } = useSingleFlight();

    const handleDetails = () => void router.navigate({ pathname: '/account/[id]/details', params: { id: String(accountId) } });
    const handleEdit = () => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(accountId) } });
    const handleMarkExternal = () =>
        void runMarkExternal(
            Effect.gen(function* () {
                const confirmed = yield* confirmAlert({
                    title: t`Mark as External?`,
                    message: t`This account will be archived and its transfers will become income and expenses on your other accounts. This cannot be undone.`,
                    confirmText: t`Mark External`,
                    cancelText: t`Cancel`,
                    isDestructive: true
                });

                if (!confirmed) {
                    return;
                }

                const externalAccountService = yield* ExternalAccountService;

                yield* externalAccountService.markExternal(accountId);
            }).pipe(toastOnFailure(t`Could not mark account as external`))
        );

    const isBusy = isLoading || isMarkingExternal;
    const triggerTestID = testID(rowTestID, TestIDPartEnum.MENU).testID;

    return (
        <ActionsMenu
            trigger={children}
            accessibilityLabel={t`${accountTitle}, account actions`}
            isDisabled={isBusy}
            triggerClassName="flex-row items-center gap-x-sm min-h-[60px] py-lg"
            hitSlop={0}
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
                onPress={handleMarkExternal}
                {...testID(rowTestID, TestIDPartEnum.MENU, TestIDPartEnum.EXTERNAL)}
            />
            <ActionsMenuItem
                icon={UserIconNameEnum.Archive}
                label={t`Archive`}
                onPress={handleArchive}
                variant="destructive"
                {...testID(rowTestID, TestIDPartEnum.MENU, TestIDPartEnum.ARCHIVE)}
            />
        </ActionsMenu>
    );
};
