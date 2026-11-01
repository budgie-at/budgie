import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ActionsMenuContext } from '../../context/actions-menu.context';
import { EntityOperationEnum } from '../../enum/entity-operation.enum';
import { useEntityOperation } from '../../hook/use-entity-operation.hook';
import { useFormatEntityUsage } from '../../hook/use-format-entity-usage.hook';
import { usePopoverMenuAnchor } from '../../hook/use-popover-menu-anchor.hook';
import { useVibration } from '../../hook/use-vibration.hook';
import { cn } from '../../utils/cn.util';
import { ActionsMenuItem } from '../actions-menu-item/actions-menu-item';
import { DeletableRow } from '../deletable-row/deletable-row';
import { GroupedListItem } from '../grouped-list-item/grouped-list-item';
import { GroupedListRow } from '../grouped-list-row/grouped-list-row';
import { Icon } from '../icon/icon';
import { LoadingContent } from '../loading-content/loading-content';
import { PopoverMenu } from '../popover-menu/popover-menu';

import type { EntityRowOperationsInterface } from '../../interface/entity-row-operations.interface';
import type { EntityUsageInterface } from '../../interface/entity-usage.interface';
import type { TagEntityInterface } from '@budgie/contracts';
import type { ReactNode } from 'react';
import type { AccessibilityActionEvent } from 'react-native';

interface Props {
    readonly entity: Pick<TagEntityInterface, 'id' | 'title'>;
    readonly usage: EntityUsageInterface | undefined;
    readonly left: ReactNode;
    readonly testID: string;
    readonly isFirst: boolean;
    readonly isLast: boolean;
    readonly onOpen: () => void;
    readonly operations: EntityRowOperationsInterface;
}

export const EntityListRow = ({ entity, usage, left, testID, isFirst, isLast, onOpen, operations }: Props) => {
    const { t } = useLingui();
    const [notify] = useVibration();
    const formatUsage = useFormatEntityUsage();
    const { isPending, mutatingOperation, start } = useEntityOperation();
    const { anchor, frameRef, closeMenu, handleCloseComplete, handleToggleMenu, isMenuOpen } = usePopoverMenuAnchor();
    const mergeLabel = t`Merge into…`;

    const notifyWhenCompleted = (isCompleted: boolean) =>
        isCompleted ? Effect.sync(() => void notify(NotificationFeedbackType.Success)) : Effect.void;

    const { onMerge } = operations;
    const handleMerge = isDefined(onMerge)
        ? () =>
              void start(EntityOperationEnum.MERGE, trackMutation =>
                  onMerge(trackMutation).pipe(Effect.flatMap(target => notifyWhenCompleted(isDefined(target))))
              )
        : null;

    const handleDelete = () =>
        void start(EntityOperationEnum.DELETE, trackMutation =>
            operations.onDelete(trackMutation).pipe(Effect.flatMap(notifyWhenCompleted))
        );

    const accessibilityActionHandlers = new Map<string, () => void>([
        ...(isDefined(handleMerge) ? [[EntityOperationEnum.MERGE, handleMerge] as const] : []),
        [EntityOperationEnum.DELETE, handleDelete]
    ]);

    const handleAccessibilityAction = ({ nativeEvent }: AccessibilityActionEvent) =>
        void accessibilityActionHandlers.get(nativeEvent.actionName)?.();

    const accessory = (
        <LoadingContent isLoading={isDefined(mutatingOperation)}>
            <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
        </LoadingContent>
    );

    const pressableProps = {
        onLongPress: handleToggleMenu,
        disabled: isPending,
        accessibilityState: { disabled: isPending, busy: isDefined(mutatingOperation) },
        accessibilityActions: [
            ...(isDefined(handleMerge) ? [{ name: EntityOperationEnum.MERGE, label: mergeLabel }] : []),
            { name: EntityOperationEnum.DELETE, label: operations.deleteLabel }
        ],
        onAccessibilityAction: handleAccessibilityAction
    };

    return (
        <GroupedListItem isFirst={isFirst} isLast={isLast}>
            <DeletableRow id={entity.id} onDelete={handleDelete} label={operations.deleteLabel} isDisabled={isPending} variant="fill">
                <View ref={frameRef} className={cn(isMenuOpen && 'bg-surface-fill')}>
                    <GroupedListRow
                        testID={testID}
                        left={<View className="min-h-[42px] justify-center">{left}</View>}
                        title={entity.title}
                        subtitle={formatUsage(usage)}
                        onPress={onOpen}
                        right={accessory}
                        pressableProps={pressableProps}
                    />
                </View>
            </DeletableRow>
            <PopoverMenu isOpen={isMenuOpen} onClose={closeMenu} onCloseComplete={handleCloseComplete} anchor={anchor} align="start">
                <ActionsMenuContext value={closeMenu}>
                    <View className="py-sm">
                        <ActionsMenuItem icon={UserIconNameEnum.Pencil} label={t`Edit`} onPress={onOpen} />
                        {isDefined(handleMerge) ? (
                            <ActionsMenuItem icon={UserIconNameEnum.GitMerge} label={mergeLabel} onPress={handleMerge} />
                        ) : null}
                        <ActionsMenuItem
                            icon={UserIconNameEnum.Trash2}
                            label={operations.deleteLabel}
                            onPress={handleDelete}
                            variant="destructive"
                        />
                    </View>
                </ActionsMenuContext>
            </PopoverMenu>
        </GroupedListItem>
    );
};
