import * as Schema from 'effect/Schema';

import { isString } from '@rnw-community/shared';

import { isUserIcon } from '../type-guard/is-user-icon.type-guard';

import type { UserIconType } from '../type/user-icon.type';

export const UserIconSchema = Schema.declare((value: unknown): value is UserIconType => isString(value) && isUserIcon(value), {
    message: 'Invalid icon selected'
});
