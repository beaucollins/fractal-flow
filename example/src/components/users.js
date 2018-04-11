// @flow
import type { Component } from 'fractal';
import socketIOComponent from './socket-io-dep';

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

export opaque type SocketIONamespace = any;
export opaque type SocketIOSocket = any;

export default (namespace: SocketIONamespace, onConnection: (SocketIOSocket) => Promise<void>): UserComponent => socketIOComponent( {
	namespace,
	onConnection,
	effectHandler: ( effect ) => {
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
			return;
		}
	},
} );
