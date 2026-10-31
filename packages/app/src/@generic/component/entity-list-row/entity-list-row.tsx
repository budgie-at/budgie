import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuContext } from '../../context/actions-menu.context';
import { useDeletableRowDelete } from '../../context/deletable-row.context';
import { useFormatEntityUsage } from '../../hook/use-format-entity-usage.hook';
import { usePopoverMenuAnchor } from '../../hook/use-popover-menu-anchor.hook';
import { appRuntime } from '../../runtime/app.runtime';
import { logAndContinue } from '../../utils/log-and-continue.util';
import { ActionsMenuItem } from '../actions-menu-item/actions-menu-item';
import { GroupedListItem } from '../grouped-list-item/grouped-list-item';
import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { PopoverMenu } from '../popover-menu/popover-menu';

import type { EntityUsageInterface } from '../../interface/entity-usage.interface';
import type { AppServices } from '../../runtime/app.runtime';
import type * as Effect from 'effect/Effect';
import type { ReactNode } from 'react';

interface Props {
    readonly title: string;
    readonly usage: EntityUsageInterface | undefined;
    readonly left: ReactNode;
    readonly onOpen: () => void;
    readonly onMerge: () => Effect.Effect<unknown, unknown, AppServices>;
    readonly testID: string;
    readonly isFirst: boolean;
    readonly isLast: boolean;
}

export const EntityListRow = ({ title, usage, left, onOpen, onMerge, testID, isFirst, isLast }: Props) => {
    const { t } = useLingui();
    const formatUsage = useFormatEntityUsage();
    const deleteRow = useDeletableRowDelete();
    const { anchor, closeMenu, handleCloseComplete, handleToggleMenu, isMenuOpen } = usePopoverMenuAnchor();

    const handleMerge = () => void appRuntime.runFork(logAndContinue(onMerge()));

    return (
        <GroupedListItem isFirst={isFirst} isLast={isLast}>
            <GroupedListRow
                testID={testID}
                left={left}
                title={title}
                subtitle={formatUsage(usage)}
                onPress={onOpen}
                onLongPress={handleToggleMenu}
            />
            <PopoverMenu isOpen={isMenuOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor} align="auto">
                <ActionsMenuContext value={closeMenu}>
                    <View className="py-sm">
                        <ActionsMenuItem icon={UserIconNameEnum.Pencil} label={t`Edit`} onPress={onOpen} />
                        <ActionsMenuItem icon={UserIconNameEnum.GitMerge} label={t`Merge into…`} onPress={handleMerge} />
                        {isDefined(deleteRow) ? (
                            <ActionsMenuItem icon={UserIconNameEnum.Trash2} label={t`Delete`} onPress={deleteRow} variant="destructive" />
                        ) : null}
                    </View>
                </ActionsMenuContext>
            </PopoverMenu>
        </GroupedListItem>
    );
};
