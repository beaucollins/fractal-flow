// @flow
import type { Component, Dispatcher } from '../../fractal';
export opaque type SocketIOSocket = any;
export opaque type SocketIONamespace = any;
export type SocketContext = { socket: SocketIOSocket, namespace: SocketIONamespace };

type Signal<Action>
	= SocketListener<Action>
	| SocketEmit;

type SocketEmit = {
	type: 'socketEmit',
	socket: SocketIOSocket,
	eventName: string,
	arguments: any[]
}

export type SocketListener<Action> = {
	type: 'socketListener',
	socket: SocketIOSocket,
	eventName: string,
	dispatch: Dispatcher<Action>,
	action: (... any[]) => Action
};

type SocketAction
	= ConnectAction;

type ConnectAction = { context: SocketContext, type: 'connect' };

export type SocketIOComponent<Action> = Component<SocketAction, Signal<Action>>;

// question, how to set up listeners for specific events?
// can we create a fully typed event action?

function createSocketIOComponent<Action>( namespace: SocketIONamespace ): SocketIOComponent<Action> {
	return ( dispatcher: Dispatcher<SocketAction> ) => {
		namespace.on( 'connection', ( socket: SocketIOSocket ) => {
			const context: SocketContext = {
				namespace, socket
			};
			
			dispatcher( { context, type: 'connect', action: { type: 'connect' } } );
		} );
		return effect => {
			// manipulates the namespace or socket
			switch( effect.type ) {
			case 'socketEmit':
				effect.socket.emit( effect.eventName, ... effect.arguments );
				break;
			case 'socketListener':
				effect.socket.on( effect.eventName, ( ... params ) => {
					effect.dispatch( effect.action( ... params ) );
				} );
				break;
			}
		};
	};
}

export default createSocketIOComponent;