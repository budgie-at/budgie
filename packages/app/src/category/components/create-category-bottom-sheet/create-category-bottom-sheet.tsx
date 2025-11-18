import { CategoryCreateEntitySchema, UserIconNameEnum } from '@budgie/contracts';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Trans, useLingui } from '@lingui/react/macro';
import { RefObject, useImperativeHandle, useRef, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { prettifyError } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { BottomSheet } from '../../../@generic/components/bottom-sheet/bottom-sheet';
import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { categoryRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { getCategoryByIdQuery } from '../../query/get-category-by-id.query';
import { BottomSheetView } from '../../../@generic/components/bottom-sheet-view/bottom-sheet-view';
import { IconSelector } from '../../../@generic/components/icon-selector/icon-selector';

interface Props {
    readonly ref: RefObject<{ open: (categoryId: number | null) => void } | null>;
}

export const CreateCategoryBottomSheet = ({ ref }: Props) => {
    const { t } = useLingui();
    const [icon, setIcon] = useState(UserIconNameEnum.Home)
    const [title, setTitle] = useState('');
    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);

    const handleSubmit = async () => {
        const parsed = CategoryCreateEntitySchema.safeParse({
            title,
            icon: 'Home'
        });

        Keyboard.dismiss();

        if (parsed.success) {
            await categoryRepository.create(parsed.data);

            setTitle('');

            bottomSheetRef.current?.close();
        } else {
            Toast.show({
                type: 'error',
                text1: t`Could not create category`,
                text2: prettifyError(parsed.error)
            });
        }
    };

    const handleDismiss = () => void setTitle('');

    useImperativeHandle(ref, () => ({
        open: (categoryId: number | null) => {
            if (isDefined(categoryId)) {
                const category = getCategoryByIdQuery(categoryId);

                if (isDefined(category)) {
                    setTitle(category.title);
                }
            }

            bottomSheetRef.current?.open();
        }
    }));

    return (
        <BottomSheet onDismiss={handleDismiss} ref={bottomSheetRef}>
            <BottomSheetView>
                <View className="gap-y-1 mb-10 items-center">
                    <View className={'bg-secondary-background p-xl rounded-3xl mb-3xl border border-secondary-corner'}>
                        <Icon icon={ICONS.Folder} className={'text-primary'} size={28} />
                    </View>

                    <Text className="text-center text-3xl text-primary font-semibold">
                        <Trans>Create Category</Trans>
                    </Text>
                    <Text className="text-center text-sm text-secondary-foreground">
                        <Trans>Add a new category to organize your transactions</Trans>
                    </Text>
                </View>

                <View className={'gap-y-3xl'}>
                    <View className="gap-y-xs">
                        <Text className={'uppercase text-secondary-foreground text-xs'}>
                            <Trans>Category Name</Trans>
                        </Text>

                        <BottomSheetTextInput
                            value={title}
                            onChangeText={setTitle}
                            placeholder={t`Search categories...`}
                            className={
                                'text-md text-primary placeholder:text-secondary-foreground h-[56px] px-5xl bg-secondary-background rounded-5xl border border-secondary-corner'
                            }
                        />
                    </View>

                    <View className="gap-y-xs">
                        <Text className={'uppercase text-secondary-foreground text-xs'}>
                            <Trans>Icon</Trans>
                        </Text>

                        <IconSelector icon={icon} onSelect={setIcon} />
                    </View>

                    <View className="gap-y-xs">
                        <Text className={'uppercase text-secondary-foreground text-xs'}>
                            <Trans>Preview</Trans>
                        </Text>

                        <Card className={'flex-row items-center gap-x-xl text-sm'}>
                            <CircleIcon size={'xl'} icon={ICONS.Home} variant={'default'} />

                            <Text className={'text-primary flex-1'}>{title}</Text>

                            <Text className={'text-secondary-foreground text-xs'}>
                                <Trans>Change</Trans>
                            </Text>
                        </Card>
                    </View>

                    <View className={'flex-row gap-x-md pt-md'}>
                        <Pressable className={'bg-primary-reverse flex-1 rounded-5xl p-2xl border border-secondary-corner'}>
                            <Text className={'text-primary text-center'}>
                                <Trans>Cancel</Trans>
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={handleSubmit}
                            className={'bg-primary flex-1 rounded-5xl p-2xl flex-row gap-x-md items-center justify-center'}
                        >
                            <Icon icon={ICONS.Check} className={'text-primary-reverse'} size={16} />

                            <Text className={'text-primary-reverse text-center'}>
                                <Trans>Submit</Trans>
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </BottomSheetView>
        </BottomSheet>
    );
};
