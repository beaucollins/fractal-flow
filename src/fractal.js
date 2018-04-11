// @flow
export type Dispatcher<Action> = (Action) => void | Promise<void>;
export type Signaler<Signal> = (Signal) => void | Promise<void>;
export type Component<Action, Signal> = (Dispatcher<Action>) => Signaler<Signal>;

export function mapComponent<A1, S1, A2, S2>( mapActivity: (A1) => A2, mapSignal: S2 => ?S1, component: Component<A1, S1> ): Component<A2, S2> {
	return ( dispatcher: Dispatcher<A2> ) => {
		const handler = component( ( activity ) => {
			dispatcher( mapActivity( activity ) );
		} );
		return signal => {
			const result = mapSignal( signal );
			if ( result ) {
				handler( result );
			}
		};
	};
} 

export function combineComponents<Action, Signal>( ... components: Component<Action, Signal>[] ): Component<Action, Signal> {
	return ( dispatch: Dispatcher<Action> ) => {
		const all = components.map( component => component( dispatch ) );
		return effect => {
			all.map( handler => handler( effect ) );
		};
	};
}

/**
 * Given a promise to resolve and a dispatcher, it buffers actions that are functions that will take the
 * value that is resolved by the promise.
 *
 * When the promise resolves all buffered actions will be dispatched with the resolved value and all future
 * dispatches will be called immediatley.
 *
 * Example:
 *
 * // a dispatcher that dispatches a string that is the username of a User type
 * type User = { userName: string };
 * type UsernameDispatcher: Dispatcher<string>;
 * type UserFetcher = () => Promise<User>;
 *
 * // fetches a user from some kind of API
 * const fetchUser: ( userID: numebr ) => Promise<User> = api.getUser( userID );
 *
 * const dispatch: UsernameDispatcher = username => {
 * 	console.log( 'got a username', username );
 * };
 *
 * const dispatchAfterFetchUser = bufferedDispatcher( fetchUser( 237 ), dispatch );
 *
 * dispatchAfterUser( user => {
 *	 return user.userName;
 * } )
 */
export function createBufferedDispatcher<T, Action>( resolver: Promise<T>, dispatch: Dispatcher<Action> ): Dispatcher<T => Action> {
	let resolved: ?T = null;

	const buffer: (T => Action)[] = [];

	resolver.then( value => {
		resolved = value;
		while( buffer.length > 0 ) {
			dispatch( buffer.shift()( value ) );
		}
	} );

	return action => {
		if ( resolved ) {
			dispatch( action( resolved ) );
			return;
		}
		buffer.push( action );
	};
}
