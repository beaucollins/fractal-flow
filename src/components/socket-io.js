// @flow
type SocketIONamespace = any;
type SocketIOSocket = any;
type SocketAuthenticator = SocketIOSocket => Promise<void>;
type SocketIOConfig<Signal> = {
	namespace: SocketIONamespace,
	onConnection: SocketAuthenticator,
	effectHandler: Signaler<Signal>
}

import type { Component, Signaler } from '../fractal';

function socketIOComponent<Action, Signal>( config: SocketIOConfig<Signal> ): Component<Action, Signal> {
	return dispatch => {
		config.namespace.on( 'connection', async ( connection ) => {
			await config.onConnection( connection );
			connection.on( 'dispatch', ( action: Action ) => {
				dispatch( action );
			} );
		} );
		return config.effectHandler;
	};  
}

export default socketIOComponent;