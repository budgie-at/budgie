import { UserIconNameEnum } from '@budgie/contracts';
import { Image } from 'expo-image';
import React from 'react';
import { Text, View } from 'react-native';
import { withUniwind } from 'uniwind';

import { EmptyFn, emptyFn, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { CreateAccountScreenSelector } from '../../../account/component/create-account-screen/create-account-screen.selector';
import { CircleIcon } from '../circle-icon/circle-icon';
import { Icon } from '../icon/icon';
import { SelectorRow } from '../selector-row/selector-row';

interface Props {
    readonly onSelect: EmptyFn;
    readonly isSelected: boolean;
    readonly title: string;
    readonly image: string | null;
    readonly emails: string[];
    readonly phoneNumbers: string[];
}

const StyledImage = withUniwind(Image);

const blurhash =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';
const placeholder = { blurhash };

export const ContactSelectorCard = (props: Props) => {
    const { isSelected, onSelect, title, image, emails, phoneNumbers } = props;

    const handleSelect = isSelected ? emptyFn : onSelect;
    const icon = isNotEmptyString(image) ? (
        <StyledImage
            className="h-[36px] w-[36px] rounded-full"
            source={image}
            placeholder={placeholder}
            contentFit="cover"
            transition={1000}
        />
    ) : (
        <CircleIcon
            icon={UserIconNameEnum.User}
            variant="secondary"
            size={36}
            iconSize={18}
            radius={18}
            border={false}
            className="bg-surface-disc"
        />
    );

    const hasEmails = isNotEmptyArray(emails);
    const hasPhoneNumbers = isNotEmptyArray(phoneNumbers);

    const subtitle =
        hasEmails || hasPhoneNumbers ? (
            <View className="gap-y-xxs">
                {emails.map(email => (
                    <View key={email} className="flex-row items-center gap-x-sm">
                        <Icon icon={UserIconNameEnum.Mail} className="text-secondary-foreground" size={12} />
                        <Text className="text-secondary-foreground text-[13px] leading-[18px]">{email}</Text>
                    </View>
                ))}
                {phoneNumbers.map(phoneNumber => (
                    <View key={phoneNumber} className="flex-row items-center gap-x-sm">
                        <Icon icon={UserIconNameEnum.Phone} className="text-secondary-foreground" size={12} />
                        <Text className="text-secondary-foreground text-[13px] leading-[18px]">{phoneNumber}</Text>
                    </View>
                ))}
            </View>
        ) : null;

    return (
        <SelectorRow
            isSelected={isSelected}
            onPress={handleSelect}
            testID={CreateAccountScreenSelector.ContactOption(title)}
            left={icon}
            title={title}
            subtitle={subtitle}
        />
    );
};
