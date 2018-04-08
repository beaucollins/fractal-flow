// @flow
export type UserAction
    = IncrementAction;

type IncrementAction = { type: 'INCREMENT', amount: number };
