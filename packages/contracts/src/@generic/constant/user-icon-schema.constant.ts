import { custom } from 'zod';

import { isString } from '@rnw-community/shared';

import { isUserIcon } from '../type-guard/is-user-icon.type-guard';

import type { UserIconType } from '../type/user-icon.type';

export const UserIconSchema = custom<UserIconType>(value => isString(value) && isUserIcon(value), { message: 'Invalid icon selected' });
