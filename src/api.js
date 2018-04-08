// @flow

export interface UserAPI<UserType, StateShape, ActionType> {
	getState( user: UserType ): Promise<StateShape>;
	dispatch( user: UserType, action: ActionType ): ActionType;
	subscribe( user: UserType, subscriber: () => any ): () => void;
}

async function setup<U, S, A>( socket: any, authenticate: ( socket: any ) => Promise<U>, api: UserAPI<U, S, A> ): Promise<void> {
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
				console.log( 'dispatching' );
				complete( null, await api.dispatch( actionUser, action ) );
			} catch ( error ) {
				console.error( 'failed to dispatch', error );
				complete( error.message );
			}
		};
		actionBuffer.push( pendingDispatch );
		runIfAuthenticated();
	} );
	// 1. Determine who the user is
	user = await authenticate( socket );
	console.log( 'user authenticated', user );
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

export default setup;