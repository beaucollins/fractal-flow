// @flow
import type { Component, Dispatcher } from '../../fractal';
import createSocketComponent from './socket-io';
import type { SocketIOComponent, SocketIONamespace, SocketListener, SocketIOSocket } from './socket-io';

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

// type EmitListener<Actor, Action> = ( ... any[] ) => Activity<Actor, Action>;

const socketActionEmitter = <Action>( socket: SocketIOSocket, eventName: string, dispatch: Dispatcher<Action>, action: ( ... any[] ) => Action ): SocketListener<Action> => {
	return {
		type: 'socketListener',
		socket,
		eventName,
		dispatch,
		action
	};
};

const createOperatorComponent: OperatorComponentCreator = (namespace: SocketIONamespace) => {
	const component:SocketIOComponent<OperatorAction> = createSocketComponent( namespace );
	// configure the component to subscribe to a socket and emit specific actions
	return ( dispatch ) => {
		// TODO: Map the dispatch from socket stuff to operator stuff
		const socketSignaler = component( activity => {
			const socket = activity.context.socket;
			switch( activity.type ) {
			case 'connect':
				socketSignaler( socketActionEmitter(socket, 'hello', dispatch, () => {
					return { operator: { id: 'fake' }, type: 'hi' };
				} ) );
				// an operator has connected, translate into operator action?
				// set up some emit action dispatchers?
				socketSignaler( { type: 'socketEmit', socket, eventName:'auth', arguments: [ ( token: Operator ) => {
					// we can authenticate the operator here
					dispatch( { operator: token, type: 'authenticated' } );
				} ] } );
				break;
			}
		} );
		return effect => {
			// when an operator effect happens, we can not
			if ( effect ) {
				throw new Error( 'unexpected effect' );
			}
		};
	};
};

export default createOperatorComponent;