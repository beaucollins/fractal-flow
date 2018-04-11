// @flow
import type { Component } from 'fractal';
import { createBufferedDispatcher } from 'fractal';
import type { SocketIOSocket, SocketIONamespace } from './socket-io';
import createSocketComponent, { createSocketActionListener } from './socket-io';

type UserID = string;
export type User = { id: UserID };
export type Action
 = { user: User, action: 'grow' }
 | { user: User, action: 'sink' };

export type Signal
	= { type: 'socket', socket: SocketIOSocket, action: SocketActionType  }
	| { type: 'emit', name: string, to?: string | string[], args: mixed[] }
	| { type: 'sync', userID: UserID };

type SocketActionType
	= { type: 'leave', room: string }
	| { type: 'join', room: string }
	| { type: 'emit', name: string, args: mixed[] }
	| { type: 'disconnect' }

export type UserComponent = Component<Action, Signal>;

type Authenticator = (SocketIOSocket) => Promise<User>;

export default function(namespace: SocketIONamespace, authenticator: Authenticator): UserComponent {
	const component = createSocketComponent( namespace );
	// configure the component to subscribe to a socket and emit specific actions
	return ( dispatch ) => {
		component( activity => {
			// set up some emit action dispatchers?
			const auth = authenticator( activity.socket );
			const bufferedDispatch = createBufferedDispatcher( auth, dispatch );

			const listenFor = ( eventName: string, action: ( ... mixed[] ) => (User => Action) ) =>
				createSocketActionListener( activity.socket, eventName, bufferedDispatch, action );

			listenFor( 'grow', () => {
				return user => ( { user, action: 'grow' } );
			} );
		} );

		// currently we don't know what to do with ourselves
		return effect => {
			if ( effect.type ) {
				switch( effect.type ) {
				case 'sync':
					break;
				case 'emit':
					( effect.to
						? namespace.to( effect.to )
						: namespace )
						.emit( effect.name, ... effect.args );
					break;
				case 'socket':
					switch ( effect.action.type ) {
					case 'emit':
						effect.socket.emit( effect.action.name, ... effect.action.args );
						break;
					case 'leave':
						effect.socket.leave( effect.action.room );
						break;
					case 'join':
						effect.socket.join( effect.action.room );
						break;
					case 'disconnect':
						effect.socket.disconnect();
						break;
					}
				}
			}
		};
	};
}
