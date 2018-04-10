// @flow
type SocketIONamespace = any;
type SocketIOSocket = any;
type SocketAuthenticator<Actor> = SocketIOSocket => Promise<Actor>;
type SocketIOConfig<Actor, Signal> = {
	namespace: SocketIONamespace,
	authenticator: SocketAuthenticator<Actor>,
	effectHandler: Signaler<Signal>
}

import type { Component, Signaler } from '../fractal';

function socketIOComponent<Actor, Action, Effect>( config: SocketIOConfig<Actor, Effect> ): Component<Actor, Action, Effect> {
	return dispatch => {
		config.namespace.on( 'connection', async ( connection ) => {
			const actor = await config.authenticator( connection );
			connection.on( 'dispatch', ( action: Action ) => {
				console.log( 'dispatch?' );
				dispatch( { actor, action } );
			} );
		} );
		return config.effectHandler;
	};  
}

export default socketIOComponent;