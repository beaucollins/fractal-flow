import type { UserID } from './model';
// @flow
// Effects are sent to the user and happen as a side-effect to something happening an the server
// For example, a user can heal another user, the user initializing the healing dispatches the
// heal action targeting the user they want to heal. The heal action will update server state and
// eventually sync the state to the connected clients. However, we will also want to notify the
// user receiving the healing of the event happenning in real time.
//
// The healed user _could_ watch for changes in the document that would indicate that the healing
// happenned but it would be difficulty to know whe healed them and by what means. Maybe they were
// healed by some other means. Just watching their hitpoints increase will not necessarily give them
// enough information to know why they were healed.
//
// This is where effects come in. They notify a user in realtime about things that are relevant that
// may have changed the state data.
export type UserEffect
 = HealedEffect;
 
type HealedEffect = {
    type: 'HEALED',
    byUser: UserID
}