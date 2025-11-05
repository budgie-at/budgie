import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';

import { settingsSlice } from '../settings/store/settings.slice';

const rootReducer = combineReducers({
    [settingsSlice.name]: settingsSlice.reducer
});

 
const persistedReducer = persistReducer(
    {
        key: 'root',
        storage: AsyncStorage,
        version: 1
    },
    rootReducer
) as unknown as typeof rootReducer;

export const appRootStore = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false })
});
export const appRootPersistor = persistStore(appRootStore);

export type RootState = ReturnType<typeof appRootStore.getState>;
export type AppDispatch = typeof appRootStore.dispatch;
