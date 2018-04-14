// @flow
import type { Component } from 'fractal';
import { createBufferedDispatcher } from 'fractal';
import type { SocketIOSocket, SocketIONamespace } from './socket-io';
import createSocketComponent, { createSocketActionListener, joinSocketToRoom } from './socket-io';

type UserID = string;
export type User = { id: UserID };

export type UserAction
 = { user: User, action: 'grow' }
 | { user: User, action: 'shrink' }
 | { user: User, action: 'dispatch', userAction: mixed };

export type UserSignal
	= { type: 'timer', time: number }
	| { type: 'broadcast', message: string }
	| { type: 'sync', userID: UserID };

export type UserComponent = Component<UserAction, UserSignal>;

type Authenticator = (SocketIOSocket) => Promise<User>;

export default function(namespace: SocketIONamespace, authenticator: Authenticator): UserComponent {
	const component = createSocketComponent( namespace );
	// configure the component to subscribe to a socket and emit specific actions
	return ( dispatch ) => {
		const signaler = component( activity => {
			// set up some emit action dispatchers?
			const auth = async () => {
				const user = await authenticator( activity.socket );
				await joinSocketToRoom( activity.socket, user.id );
				return user;
			};
			const bufferedDispatch = createBufferedDispatcher( auth(), dispatch );

			const listenFor = ( eventName: string, action: ( ... mixed[] ) => (User => UserAction) ) =>
				createSocketActionListener( activity.socket, eventName, bufferedDispatch, action );

			listenFor( 'grow', () => {
				return user => ( { user, action: 'grow' } );
			} );
			listenFor( 'shrink', () => {
				return user => ( { user, action: 'shrink' } );
			} );
			listenFor( 'dispatch', ( userAction ) => {
				return user => ( { user, action: 'dispatch', userAction } );
			} );
		} );

		return signal => {
			if ( signal.type ) {
				switch( signal.type ) {
				case 'sync':
					signaler( { type: 'emit', eventName: 'api.state', to: signal.userID, emitArgs: [ { hello: 'world' } ] } );
					break;
				case 'timer':
					signaler( { type: 'emit', eventName: 'time', emitArgs: [ signal.time ] } );
					break;
				case 'broadcast':
					signaler( { type: 'emit', eventName: 'broadcast', emitArgs: [ signal.message ] } );
					break;
				}
			}
		};
	};
}
