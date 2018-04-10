// @flow
import type { Component } from '../../fractal';
import socketIOComponent from '../../components/socket-io';

type UserID = string;
export type User = { id: UserID };
export type Action = 'grow' | 'shrink';
export type Effect
	= { type: 'socket', socket: SocketIOSocket, action: SocketActionType  }
	| { type: 'emit', name: string, to?: string | string[], args: mixed[] }
	| { type: 'sync', userID: UserID };

type SocketActionType
	= { type: 'leave', room: string }
	| { type: 'join', room: string }
	| { type: 'emit', name: string, args: mixed[] }
	| { type: 'disconnect' }

export type UserComponent = Component<User, Action, Effect>;

type SocketIONamespace = any;
type SocketIOSocket = any;

type Document = {
	user: User,
	stuff: 'string'
}

export default (namespace: SocketIONamespace, authenticator: (SocketIOSocket) => Promise<User>): UserComponent => socketIOComponent( {
	namespace,
	authenticator,
	effectHandler: ( effect ) => {
		if ( effect.type ) {
			switch( effect.type ) {
			case 'sync':
				console.log( 'sync document to user', effect.userID );
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
			return;
		}
	},
} );
