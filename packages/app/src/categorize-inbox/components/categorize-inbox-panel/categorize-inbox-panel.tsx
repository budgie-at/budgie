import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxProgress } from '../categorize-inbox-progress/categorize-inbox-progress';
import { CategorizeInboxUndoBar } from '../categorize-inbox-undo-bar/categorize-inbox-undo-bar';
import { CategorizeInboxUndoLayout } from '../categorize-inbox-undo-layout/categorize-inbox-undo-layout';

import { CategorizeInboxPanelSelector } from './categorize-inbox-panel.selector';

export const CategorizeInboxPanel = () => {
    const { t } = useLingui();
    const { assign, acceptableAssignments, lastWrite, movedToCashTransactionIds, undoMoveToCash } = useCategorizeInboxContext();

    const handleAcceptAllPress = (): void => void assign(acceptableAssignments);
    const handleUndoMoveToCashPress = (): void => void undoMoveToCash(movedToCashTransactionIds);

    const rowCount = acceptableAssignments.reduce((total, assignment) => total + assignment.rows.length, 0);
    const acceptAllText = [
        t({ message: plural(acceptableAssignments.length, { one: 'Accept # suggestion', other: 'Accept # suggestions' }) }),
        t({ message: plural(rowCount, { one: '# transaction', other: '# transactions' }) })
    ].join(' · ');
    const movedToCashDescription = t({
        message: plural(movedToCashTransactionIds.length, { one: '# transaction', other: '# transactions' })
    });
    const movedToCashUndo = isNotEmptyArray(movedToCashTransactionIds) ? (
        <CategorizeInboxUndoLayout
            icon={UserIconNameEnum.Banknote}
            title={t`Moved to cash`}
            description={movedToCashDescription}
            onUndo={handleUndoMoveToCashPress}
        />
    ) : null;
    const labelUndo = isDefined(lastWrite) ? <CategorizeInboxUndoBar /> : null;
    const acceptAll = isNotEmptyArray(acceptableAssignments) ? (
        <Button
            variant="cta"
            size="md"
            leftIcon={UserIconNameEnum.CheckCheck}
            content={acceptAllText}
            onPress={handleAcceptAllPress}
            testID={CategorizeInboxPanelSelector.AcceptAllButton}
        />
    ) : (
        <Text className="text-center text-sm font-medium text-secondary-foreground" numberOfLines={1}>
            <Trans>Tap a suggestion to accept it</Trans>
        </Text>
    );

    return (
        <ScreenChromeFooter>
            <View className="gap-y-xl px-5xl pb-md pt-xl" testID={CategorizeInboxPanelSelector.Panel}>
                <CategorizeInboxProgress />

                <View className="h-14 justify-center">{labelUndo ?? movedToCashUndo ?? acceptAll}</View>
            </View>
        </ScreenChromeFooter>
    );
};
