// @flow
import type { UserID } from './model';
export type UserAction
    = IncrementAction
    | HealFriendAction;

type IncrementAction = { type: 'INCREMENT', amount: number };
type HealFriendAction = { type: 'HEAL_FRIEND', healedUserID: UserID };
