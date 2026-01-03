import { StyleSheet } from 'react-native';

import { RING_SIZE } from './animated-record-button.constant';

export const ringContainerStyle = StyleSheet.create({
    container: {
        alignItems: 'center',
        height: RING_SIZE,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        top: 0,
        width: RING_SIZE
    }
}).container;
