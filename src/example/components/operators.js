// @flow
import type { Component, Dispatcher, Activity } from '../../fractal';
import createSocketComponent from './socket-io';
import type { SocketIOComponent, SocketIONamespace, SocketListener, SocketIOSocket } from './socket-io';

type Operator = { id: string };
type Action
	= AuthenticatedAction
	| MockAction;


type MockAction = {
	type: 'hi'
}
type AuthenticatedAction = {
	type: 'authenticated'
}

type Signal = void;
type OperatorComponent = Component<Operator, Action, Signal>;
type OperatorComponentCreator = (SocketIONamespace) => OperatorComponent;

// type EmitListener<Actor, Action> = ( ... any[] ) => Activity<Actor, Action>;

const socketActionEmitter = <Actor, Action>( socket: SocketIOSocket, eventName: string, dispatch: Dispatcher<Actor, Action>, action: ( ... any[] ) => Activity<Actor, Action> ): SocketListener<Actor, Action> => {
	return {
		type: 'socketListener',
		socket,
		eventName,
		dispatch,
		action
	};
};

const createOperatorComponent: OperatorComponentCreator = (namespace: SocketIONamespace) => {
	const component:SocketIOComponent<Operator, Action> = createSocketComponent( namespace );
	// configure the component to subscribe to a socket and emit specific actions
	return ( dispatch ) => {
		// TODO: Map the dispatch from socket stuff to operator stuff
		const socketSignaler = component( activity => {
			const socket = activity.actor.socket;
			switch( activity.action.type ) {
			case 'connect':
				socketSignaler( socketActionEmitter(socket, 'hello', dispatch, () => {
					return { actor: { id: 'lol' }, action: { type: 'hi' } };
				} ) );
				// an operator has connected, translate into operator action?
				// set up some emit action dispatchers?
				socketSignaler( { type: 'socketEmit', socket, eventName:'auth', arguments: [ token => {
					// we can authenticate the operator here
					dispatch( { actor: token, action: { type: 'authenticated' } } );
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