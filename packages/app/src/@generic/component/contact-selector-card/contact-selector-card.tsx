import { UserIconNameEnum } from '@budgie/contracts';
import { Image } from 'expo-image';
import { styled } from 'nativewind';
import React from 'react';
import { Text, View } from 'react-native';

import { EmptyFn, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { AccountFormSelectors } from '../../../@e2e/selectors/account-form.selector';
import { CircleIcon } from '../circle-icon/circle-icon';
import { Icon } from '../icon/icon';
import { SelectorCard } from '../selector-card/selector-card';

interface Props {
    readonly onSelect: EmptyFn;
    readonly isSelected: boolean;
    readonly title: string;
    readonly id: string;
    readonly image: string | null;
    readonly emails: string[];
    readonly phoneNumbers: string[];
}

const StyledImage = styled(Image, { className: 'style' });

const blurhash =
    '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';
const placeholder = { blurhash };

export const ContactSelectorCard = (props: Props) => {
    const { isSelected, onSelect, title, id, image, emails, phoneNumbers } = props;

    const icon = isNotEmptyString(image) ? (
        <StyledImage className="w-8 h-8 rounded-full" source={image} placeholder={placeholder} contentFit="cover" transition={1000} />
    ) : (
        <CircleIcon icon={UserIconNameEnum.User} variant="secondary" size={32} iconSize={16} />
    );

    const hasEmails = isNotEmptyArray(emails);
    const hasPhoneNumbers = isNotEmptyArray(phoneNumbers);

    const subtitle =
        hasEmails || hasPhoneNumbers ? (
            <View className="gap-y-xs">
                {emails.map(email => (
                    <View key={email} className="flex-row items-center gap-x-sm">
                        <Icon icon={UserIconNameEnum.Mail} className="text-secondary-foreground" size={12} />
                        <Text className="text-secondary-foreground">{email}</Text>
                    </View>
                ))}
                {phoneNumbers.map(phoneNumber => (
                    <View key={phoneNumber} className="flex-row items-center gap-x-sm">
                        <Icon icon={UserIconNameEnum.Phone} className="text-secondary-foreground" size={12} />
                        <Text className="text-secondary-foreground">{phoneNumber}</Text>
                    </View>
                ))}
            </View>
        ) : null;

    return (
        <SelectorCard
            identifier={id}
            isSelected={isSelected}
            onSelect={onSelect}
            verticalAlign="top"
            testID={AccountFormSelectors.ContactOption(title)}
            iconSlot={icon}
            title={title}
            subtitle={subtitle}
        />
    );
};
