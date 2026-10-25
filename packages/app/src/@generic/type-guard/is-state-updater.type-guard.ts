import { SetStateAction } from 'react';

export const isStateUpdater = <State>(value: SetStateAction<State>): value is (previousState: State) => State =>
    typeof value === 'function';
