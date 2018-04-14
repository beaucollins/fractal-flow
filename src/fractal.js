// @flow
export type Dispatcher<Action> = (Action) => void | Promise<void>;
export type Signaler<Signal> = (Signal) => void | Promise<void>;
export type Component<Action, Signal> = (Dispatcher<Action>) => Signaler<Signal>;

export function mapComponent<A1, S1, A2, S2>( mapActivity: (A1) => ?A2, mapSignal: S2 => ?S1, component: Component<A1, S1> ): Component<A2, S2> {
	return ( dispatcher: Dispatcher<A2> ) => {
		const handler = component( ( activity ) => {
			const mappedActivity = mapActivity( activity );
			if ( mappedActivity ) {
				dispatcher( mappedActivity );
			}
		} );
		return signal => {
			const mappedSignal = mapSignal( signal );
			if ( mappedSignal ) {
				handler( mappedSignal );
			}
		};
	};
} 

/**
 * Combines multiple components of the same type into a single component.
 *
 * Combined with mapComponent one can combine components of different types into a super component
 *
 * const accumulater: Component<number, number> = ( dispatch ) => {
 *		let currentValue = 0;
 *		return ( signal ) => {
 *			currentValue += signal;
 *			dispatch( currentValue );
 *		}
 * }
 *
 * const interval: Component<void, 'stop' | 'start'> = dispatch => {
 *	 let interval: ?mixed = null;
 *	 const start = () => setInterval( dispatch, 2000 );

 *	 return signal => {
 *		if ( signal === 'stop' ) {
 *	 		clearInterval( interval );
 *		}
 *      if ( signal === 'start' && !interval ) {
 *	 		start();
 *      }	
 * }
 * 
 *
 * combineComponents(
 *	 mapComponent(
 *	 	action => ( { component: 'acc', action } ),
 *      signal => signal.component === 'acc' ? signal.signal ),
 *     accumulater
 * 	 )
 * );
 */
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
export function createBufferedDispatcher<T, Action>( resolver: Promise<T>, dispatch: Dispatcher<Action> ): Dispatcher<T => ?Action> {
	let resolved: ?T = null;

	const buffer: (T => ?Action)[] = [];

	resolver.then( value => {
		resolved = value;
		while( buffer.length > 0 ) {
			const action = buffer.shift()( value );
			if ( action ) {
				dispatch( action );
			}
		}
	} );

	return pending => {
		if ( resolved ) {
			const action = pending( resolved );
			if ( action ) {
				dispatch( action );
			}
			return;
		}
		buffer.push( pending );
	};
}


type ExtractSignalType = <A, S>(Component<A, S>) => Signaler<S>;
type ExtractAppDispatcher<T> = <A, S>(Component<A, S>) => (A, T) => void | Promise<void>;

type CombinedDispatch<O: Object, T> = $ObjMap<O, ExtractAppDispatcher<T>>;
type CombinedSignals<O: Object> = $ObjMap<O, ExtractSignalType>;

export function createApp<O: Object>(components: O): (CombinedDispatch<O, CombinedSignals<O>>) => CombinedSignals<O>  {
	return ( dispatcher ) => {
		const signals: CombinedSignals<O> = Object.keys( components ).reduce( ( acc, key ) => {
			return Object.assign( acc, { [ key ]: components[key]( action => {
				dispatcher[ key ]( action, signals );
			} ) } );
		}, {} );
		return signals;
	};
}
