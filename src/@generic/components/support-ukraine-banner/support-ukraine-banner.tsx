import { Link } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { SupportUkraineBannerStyles as styles } from './support-ukraine-banner.styles';

const donationLink = 'https://savelife.in.ua/en/donate-en/#donate-army-card-monthly';

export const SupportUkraineBanner = () => (
    <Link asChild href={donationLink}>
        <Pressable style={styles.container}>
            <Text style={styles.text}>Support Ukraine 🇺🇦</Text>
        </Pressable>
    </Link>
);
