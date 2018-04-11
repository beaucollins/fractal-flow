// @flow
import type { Component, Dispatcher } from 'fractal';
export opaque type SocketIOSocket = SocketIOSocketInterface;
export opaque type SocketIONamespace = any;
export type SocketContext = { socket: SocketIOSocket, namespace: SocketIONamespace };

interface SocketIOSocketInterface {
	emit( eventName: string, ... eventArgs: mixed[] ): self;
	removeListener( eventName: string, listener: Function ): self;
	on( evenName: string, listener: Function ): self;
}

type SocketAction = { socket: SocketIOSocket };

type Signal = void;

export type SocketListener<Action> = {
	type: 'socketListener',
	socket: SocketIOSocket,
	eventName: string,
	dispatch: Dispatcher<Action>,
	action: (... mixed[]) => Action
};

export type SocketIOComponent = Component<SocketAction, Signal>;

export type SocketActionEmitterUnscriber = () => void;

export function createSocketActionListener<Action>( socket: SocketIOSocket, eventName: string, dispatch: Dispatcher<Action>, action: ( ... mixed[] ) => Action ): SocketActionEmitterUnscriber {
	let listener = ( ... args: mixed[] ) => {
		dispatch( action( ... args ) );
	};
	socket.on( eventName, listener );

	return () => socket.removeListener( eventName, listener );
}

export function createSocketEmitter( socket: SocketIOSocket, eventName: string, ... emitArgs: mixed[] ) {
	return () => {
		socket.emit( eventName, ... emitArgs );
	};
}

function createSocketIOComponent( namespace: SocketIONamespace ): SocketIOComponent {
	return ( dispatch ) => {
		namespace.on( 'connection', ( socket: SocketIOSocket ) => {
			dispatch( { socket } );
		} );
		return signal => {
			// manipulates the namespace or socket
			if ( signal ) {
				throw new Error( 'there are no effects' );
			}
		};
	};
}

export default createSocketIOComponent;