import { Image } from 'expo-image';
import { styled } from 'nativewind';
import React from 'react';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { ICONS } from '../../constant/icons.constant';
import { CircleIcon } from '../circle-icon/circle-icon';
import { Icon } from '../icon/icon';
import { SelectorCard } from '../selector-card/selector-card';

interface Props {
    readonly onSelect: () => void;
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
        <StyledImage
            className="w-[32px] h-[32px] rounded-full"
            source={image}
            placeholder={placeholder}
            contentFit="cover"
            transition={1000}
        />
    ) : (
        <CircleIcon icon={ICONS.User} variant="secondary" size="xl" />
    );

    const hasEmails = isNotEmptyArray(emails);
    const hasPhoneNumbers = isNotEmptyArray(phoneNumbers);

    const subtitle =
        hasEmails || hasPhoneNumbers ? (
            <View className="gap-y-xs">
                {emails.map(email => (
                    <View key={email} className="flex-row items-center gap-x-sm">
                        <Icon icon={ICONS.LucideMail} className="text-secondary-foreground" size={12} />
                        <Text className="text-secondary-foreground">{email}</Text>
                    </View>
                ))}
                {phoneNumbers.map(phoneNumber => (
                    <View key={phoneNumber} className="flex-row items-center gap-x-sm">
                        <Icon icon={ICONS.Phone} className="text-secondary-foreground" size={12} />
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
            iconSlot={icon}
            title={title}
            subtitle={subtitle}
        />
    );
};
