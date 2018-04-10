// @flow
import type { Component, Dispatcher, Activity } from '../../fractal';
export opaque type SocketIOSocket = any;
export opaque type SocketIONamespace = any;
export type SocketContext = { socket: SocketIOSocket, namespace: SocketIONamespace };

type EmitRemover<EventName: string> = (EventName) => void;
type EmitListener<EventName: string, EventArguments> = (EventName, EventArguments) => void;
type EmitActionCreator<EventName: string, EventArguments> = (SocketIOSocket, EventName, EmitListener<EventName, EventArguments>) => EmitRemover<EventName>;

type Signal<Actor, Action>
	= SocketListener<Actor, Action>
	| SocketEmit;

type SocketEmit = {
	type: 'socketEmit',
	socket: SocketIOSocket,
	eventName: string,
	arguments: any[]
}

export type SocketListener<Actor, Action> = {
	type: 'socketListener',
	socket: SocketIOSocket,
	eventName: string,
	dispatch: Dispatcher<Actor, Action>,
	action: (... ?any[]) => Activity<Actor, Action>
};

type SocketAction
	= ConnectAction;

type ConnectAction = { type: 'connect' };

export type SocketIOComponent<Actor, Action> = Component<SocketContext, SocketAction, Signal<Actor, Action>>;


// question, how to set up listeners for specific events?
// can we create a fully typed event action?

function createSocketIOComponent<Actor, Action>( namespace: SocketIONamespace ): SocketIOComponent<Actor, Action> {
	return ( dispatcher: Dispatcher<SocketContext, SocketAction> ) => {
		namespace.on( 'connection', ( socket: SocketIOSocket ) => {
			const context: SocketContext = {
				namespace, socket
			};
			
			dispatcher( { actor: context, action: { type: 'connect' } } );
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