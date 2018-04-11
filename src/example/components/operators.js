// @flow
import type { Component } from '../../fractal';
import { createBufferedDispatcher } from '../../fractal';
import createSocketComponent, { createSocketActionListener, createSocketEmitter } from './socket-io';
import type { SocketIONamespace, SocketIOSocket } from './socket-io';

type Operator = { id: string };
export type OperatorAction
	= AuthenticatedAction
	| MockAction;


type MockAction = {
	type: 'hi',
	operator: Operator
}
type AuthenticatedAction = {
	operator: Operator,
	type: 'authenticated'
}

export type OperatorSignal = void;
export type OperatorComponent = Component<OperatorAction, OperatorSignal>;
type OperatorComponentCreator = (SocketIONamespace) => OperatorComponent;

/**
 * Pauses execution for the given number of milliseconds during a Promise chain.
 */
const waitFor = ( ms: number ) => new Promise( resolve => {
	setTimeout( resolve, ms );
} );

const socketAuthenticator = ( socket: SocketIOSocket ): Promise<Operator> => {
	return new Promise( resolve => {
		const emitAuth = createSocketEmitter( socket, 'auth', async ( token: Operator ) => {
			// try to authenticate the token
			await waitFor( 2000 );
			resolve( token );
		} );
		emitAuth();
	} );
};

const createOperatorComponent: OperatorComponentCreator = (namespace: SocketIONamespace) => {
	const component = createSocketComponent( namespace );
	// configure the component to subscribe to a socket and emit specific actions
	return ( dispatch ) => {
		component( activity => {
			// set up some emit action dispatchers?
			const authenticator = socketAuthenticator( activity.socket );
			const bufferedDispatch = createBufferedDispatcher( authenticator, dispatch );

			const listenFor = ( eventName: string, action: ( ... mixed[] ) => (Operator => OperatorAction) ) =>
				createSocketActionListener( activity.socket, eventName, bufferedDispatch, action );

			listenFor( 'hello', () => {
				return operator => ( { operator, type: 'hi' } );
			} );
		} );

		// currently we have no effects
		return effect => {
			if ( effect ) {
				throw new Error( 'unexpected effect' );
			}
		};
	};
};

export default createOperatorComponent;