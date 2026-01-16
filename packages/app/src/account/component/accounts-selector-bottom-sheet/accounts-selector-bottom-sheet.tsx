/* jscpd:ignore-start */
import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { useLingui } from '@lingui/react/macro';
import { FC, RefObject, useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { BottomSheetSearch } from '../../../@generic/component/bottom-sheet-search/bottom-sheet-search';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { MultiSelectFooter } from '../../../@generic/component/multi-select-footer/multi-select-footer';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { BottomSheetSnapPoints } from '../../../@generic/type/bottom-sheet-snap-points.type';
import { useSearchAccountsGroupedQuery } from '../../query/use-search-accounts-grouped.query';
import { AccountsGroup } from '../accounts-group/accounts-group';

interface Props {
    readonly selectedAccountIds: number[];
    readonly onSelect: (...accountIds: number[]) => void;
    readonly onClear: () => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

const snapPoints: BottomSheetSnapPoints = ['50%', '85%'];

export const AccountsSelectorBottomSheet = ({ ref, selectedAccountIds, onSelect, onClear }: Props) => {
    const [search, setSearch] = useState('');
    const { accountsGrouped } = useSearchAccountsGroupedQuery(search);
    const { t } = useLingui();

    const handleClose = () => void ref.current?.close();

    const hasAccounts = isNotEmptyArray(accountsGrouped.BANK) || isNotEmptyArray(accountsGrouped.CASH);

    const footerComponent: FC<BottomSheetFooterProps> = footerProps => (
        <MultiSelectFooter {...footerProps} selectedCount={selectedAccountIds.length} onClose={handleClose} onClear={onClear} />
    );

    return (
        <BottomSheet ref={ref} snapPoints={snapPoints} footerComponent={footerComponent}>
            <BottomSheetSearch onChangeText={setSearch} placeholder={t`Search accounts...`} value={search} />

            <BottomSheetScrollView enableFooterMarginAdjustment contentContainerClassName="px-xl py-xl gap-y-lg">
                {hasAccounts ? (
                    <>
                        {isNotEmptyArray(accountsGrouped.BANK) ? (
                            <AccountsGroup
                                onSelect={onSelect}
                                type={AccountTypeEnum.BANK}
                                accounts={accountsGrouped.BANK}
                                selectedAccountIds={selectedAccountIds}
                            />
                        ) : null}

                        {isNotEmptyArray(accountsGrouped.CASH) ? (
                            <AccountsGroup
                                onSelect={onSelect}
                                type={AccountTypeEnum.CASH}
                                accounts={accountsGrouped.CASH}
                                selectedAccountIds={selectedAccountIds}
                            />
                        ) : null}
                    </>
                ) : (
                    <View className="py-3xl">
                        <EmptyState
                            circleIcon={UserIconNameEnum.Wallet}
                            title={t`No accounts found`}
                            description={t`Try a different search term`}
                        />
                    </View>
                )}
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
/* jscpd:ignore-end */
