// @flow
import type { API } from './api';

async function setupSocket<U, S, A>( authenticate: ( socket: any ) => Promise<U>, socket, api: API<U, S, A> ) {
	// 0. Start buffering action dispatches
	let user: ?U = null;
	let ready = false;
	let actionBuffer:Array<( user: U ) => any> = [];
	const runIfAuthenticated = () => {
		if ( ! ready || ! user ) {
			return;
		}
		while( actionBuffer.length > 0 ) {
			const action = actionBuffer.shift();
			action( user );
		}
	};
	socket.on( 'api.dispatch', ( action, callback?: ( ... any ) => any ) => {
		const complete: ( ... any ) => any = callback ? callback : () => {};
		const pendingDispatch = async ( actionUser: U ) => {
			try {
				complete( null, await api.dispatch( actionUser, action ) );
			} catch ( error ) {
				complete( error.message );
			}
		};
		actionBuffer.push( pendingDispatch );
		runIfAuthenticated();
	} );
	// 1. Determine who the user is
	user = await authenticate( socket );
	// 2. Set up application state for the user
	const sendState = async () => {
		if ( user ) {
			socket.emit( 'api.state', await api.getState( user ) );
		}
	};
	const unsubscribe = api.subscribe( user, () => {
		sendState();
	} );
	socket.on( 'disconnect', () => unsubscribe() );
	sendState();
	ready = true;
	runIfAuthenticated();
}

function setup<U, S, A>( ioNamespace: any, authenticate: ( socket: any ) => Promise<U>, api: API<U, S, A> ) {
	ioNamespace.on( 'connection', socket => setupSocket( authenticate, socket, api ) );
	return ( sideEffect: {} ) => {
		console.log( 'deliver side effect', sideEffect );
	};
}

export default setup;