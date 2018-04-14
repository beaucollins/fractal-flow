// @flow
import type { Component, Dispatcher } from 'fractal';
export type SocketIOSocket = SocketIOSocketInterface;
export type SocketIONamespace = SocketIONamespaceInterface;
export type SocketContext = { socket: SocketIOSocket, namespace: SocketIONamespace };

interface SocketIOSocketInterface {
	emit( eventName: string, ... eventArgs: mixed[] ): self;
	removeListener( eventName: string, listener: Function ): self;
	on( evenName: string, listener: Function ): self;
	join( room: string, callback: Function ): self;
}

interface SocketIONamespaceInterface {
	on( eventName: string, Function ): self;
	to( room: string | string[] ): self;
	emit( eventName: string, ... eventArgs: mixed[] ): self;
}

type SocketAction = { socket: SocketIOSocket };

type Signal
	= EmitSignal;

type EmitSignal = {
	type: 'emit',
	eventName: string,
	to?: string | string[],
	emitArgs?: mixed | mixed[]
};

export type SocketListener<Action> = {
	type: 'socketListener',
	socket: SocketIOSocket,
	eventName: string,
	dispatch: Dispatcher<Action>,
	action: (... mixed[]) => Action
};

export type SocketIOComponent = Component<SocketAction, Signal>;

export type SocketActionEmitterUnscriber = () => void;

export function createSocketActionListener<Action>( socket: SocketIOSocket, eventName: string, dispatch: Dispatcher<Action>, actionCreator: ( ... mixed[] ) => ?Action ): SocketActionEmitterUnscriber {
	let listener = ( ... args: mixed[] ) => {
		const action = actionCreator( ... args ); 
		if ( action ) {
			dispatch( action );
		}
	};
	socket.on( eventName, listener );

	return () => socket.removeListener( eventName, listener );
}

export function createSocketEmitter( socket: SocketIOSocket, eventName: string, ... emitArgs: mixed[] ) {
	return () => {
		socket.emit( eventName, ... emitArgs );
	};
}

export function joinSocketToRoom( socket: SocketIOSocket, room: string ): Promise<void> {
	return new Promise( ( resolve, reject ) => {
		socket.join( room, ( error: Error ) => {
			if( error ) return reject( error );
			resolve();
		} );
	} );
}

const emit = (namespace: SocketIONamespace, signal: EmitSignal) => {
	const to = signal.to ? namespace.to( signal.to ) : namespace;
	const args = signal.emitArgs ? signal.emitArgs : [];
	const iterableArgs = Array.isArray( args ) ? args : [ args ];
	to.emit( signal.eventName, ... iterableArgs );
};

function createSocketIOComponent( namespace: SocketIONamespace ): SocketIOComponent {
	return ( dispatch ) => {
		namespace.on( 'connection', ( socket: SocketIOSocket ) => {
			dispatch( { socket } );
		} );
		return signal => {
			// manipulates the namespace or socket
			switch( signal.type ) {
			case 'emit':
				emit( namespace, signal );
				return;
			}
			throw new Error( 'uhandled signal' );
		};
	};
}

export default createSocketIOComponent;