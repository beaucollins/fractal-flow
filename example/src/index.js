// @flow
import type { Component, Dispatcher, Signaler } from 'fractal';
import { mapComponent, combineComponents } from 'fractal';
import createIOServer from 'socket.io';
import type { SocketIOSocket } from './components/socket-io';
import createUserComponent from './components/users';
import type { User, Action as UserAction, Signal as UserSignal } from './components/users';
import type { Signal as TimerSignal } from './components/timer';
import timerComponent from './components/timer';
import createOperatorComponent from './components/operators';
import type { OperatorAction, OperatorSignal } from './components/operators';

const userAuthenticator = ( socket: SocketIOSocket ) => new Promise( resolve => {
	socket.emit( 'auth', ( user: User ) => {
		resolve( user );
	} );
} );

const io = createIOServer();

// These are things that the components actors do to the app
type Action
	= UserComponentAction
	| { type: 'echo', action: mixed }
	| { component: 'operator', action: OperatorAction }
	| TimerComponentAction

type UserComponentAction = { action: UserAction, type: 'USER' };
type TimerComponentAction = { time: number, type: 'TIMER' };

// These are things that the app does to the component's actors
type Signal
	= UserComponentSignal
	| OperatorComponentSignal
	| { type: 'echo', action: mixed }
	| TimerComponentSignal;

type UserComponentSignal = { type: 'USER', signal: UserSignal };
type TimerComponentSignal = { type: 'TIMER', signal: TimerSignal };
type OperatorComponentSignal = { type: 'operator', signal: OperatorSignal };

type AppComponent = Component<Action, Signal>;

const users: AppComponent = mapComponent(
	( action ) => ( { type: 'USER', action } ),
	signal => {
		// ignoring all effects
		if ( signal.type === 'USER' ) {
			return signal.signal;
		}
	},
	createUserComponent(io.of('/users'), userAuthenticator)
);

const echoComponent: Component<mixed, mixed> = dispatch => dispatch;

const appComponent: Component<Action, Signal> = combineComponents(
	users,
	mapComponent(
		time => ( { type: 'TIMER', time } ),
		signal => {
			if ( signal.type === 'TIMER' ) {
				return signal.signal;
			}
		},
		timerComponent( 1000 )
	),
	appDispatcher => {
		const operatorComponent = createOperatorComponent( io.of('/operator') );
		const operatorSignaler = operatorComponent( action => {
			appDispatcher( { component: 'operator', action } );
		} );
		return ( signal ) => {
			// do something to the operators
			if ( signal.type === 'operator' ) {
				operatorSignaler();				
			}
		};
	},
	dispatch => {
		const echo = echoComponent( action => {
			dispatch( { type: 'echo', action } );
		} );

		return signal => {
			if ( signal.type === 'echo' ) {
				echo( signal.action );
			}
		};
	}
);

type Reactor<Action, Signal> = Action => ?Signal | Promise<?Signal>

const messageUser: Reactor<OperatorAction, UserSignal> = ( action ) => {
	if ( action.type === 'broadcast' ) {
		return {
			type: 'broadcast',
			message: action.message
		};
	}
	return null;
};

// this is were actors within the application send their attempts to
// do something within the application
const signal = appComponent( async action => {
	if ( action.component ) {
		if ( ! action.type && action.component === 'operator' ) {
			const result = await messageUser( action.action );
			if ( result ) {
				signal( { type: 'USER', signal: result } );
			}
		}
		return;
	}
	// we can call signals here now if we want to generate our own sideffects
	// we can call the effects whenever whe want
	if( action.type === 'TIMER' ) {
		signal( { type: 'USER', signal: {
			type: 'timer', time: action.time
		} } );
		return;
	}

	if ( action.type === 'USER' ) {
		if ( action.action.action === 'dispatch' ) {
			signal( {
				type: 'USER', signal: {
					type: 'sync',
					userID: action.action.user.id
				}
			} );
			return;	
		}
	}

	console.log( 'uhandled dispatch', action );
} );

signal( { type: 'TIMER', signal: 'start' } );
signal( { type: 'echo', action: 'hi' } );

const accumulator: Component<number, number> = dispatch => {
	let current = 0;
	return signal => {
		dispatch( current += signal );
	};
};

const interval: Component<void, void> = dispatch => {
	let id = setInterval( dispatch, 100 );
	return () => {
		clearInterval( id );
	};
};

type KeyedAction<Key, Action> = {
	key: Key,
	action: Action	
}

type KeyedSignal<Key, Signal> = {
	key: Key,
	signal: Signal
}

type KeyedComponent<Key, Action, Signal> = Component<KeyedAction<Key, Action>, KeyedSignal<Key, Signal>>;

type ComponentKey
	= IntervalComponentKey
	| AccumulatorComponentKey;

type IntervalComponentKey = 'interval';
type AccumulatorComponentKey = 'accumulator';

function keyComponent<Key, Action, Signal>(key: Key, component: Component<Action, Signal>): KeyedComponent<Key, Action, Signal> {
	return dispatcher => {
		const signaler = component( action => {
			dispatcher( { key, action } );
		} );
		return signal => {
			signaler( signal.signal );
		};
	};
}

type KeyedComponents<A, S> = {
	[key: string]: Component<A, S>
};

function combineKeyedComponents<Action, Signal>( components: KeyedComponents<Action, Signal> ): (Dispatcher<{key: $Keys<KeyedComponents<Action, Signal>>, action: Action}>) => any {
	return dispatcher => {
		const signalers:$ObjMap<typeof components, Signaler> = {};
		for (const key in components) {
			if (components.hasOwnProperty(key)) {
				const element = components[key];
				if ( element ) {
					signalers[key] = element( action => {
						dispatcher( { key, action } );
					} );
				}
			}
		}
		return signalers;
	};
}

function createApp<Action, Signal>( components: KeyedComponents<Action, Signal>, appHandler ) {
	const app = combineKeyedComponents(components);
	const signalers = app( action => {
		appHandler( action, signalers );
	} );
	return signalers;
}

const app2 = createApp( {
	accumulator,
	accumulator2: accumulator
}, ( action, signalers ) => {
	if ( action.key === '' ) {
		
	}
	console.log( 'do it', action );
	console.log( 'react?', signalers );
} );

// function combineKeyedComponents<O: KeyedComponents, KeyedSignalers: $ObjMap<O, Signaler<*>>>( components: O, app: ( *, KeyedSignalers ) => void ): KeyedSignalers {
// 	// go through each component and initialize it
// 	const component = ( dispatcher: Dispatcher<{action: *, key: string}> ): KeyedSignalers => {
// 		const signalers: { [key: string]: Signaler<*> } = {};
// 		for ( const key in components ) {
// 			if ( components.hasOwnProperty( key ) ) {
// 				const component = components[key];
// 				const signaler = component( action => {
// 					dispatcher( { action, key });
// 				} );
// 				signalers[ key ] = signaler;
// 			}
// 		}
// 		return signalers;
// 	};
// 	const keyedSignalers = component( action => {
// 		app( action, keyedSignalers );
// 	} ) ;
// 	return keyedSignalers;
// }

// const app2 = combineKeyedComponents( {
// 	accumulater,
// 	interval: ( dispatch ) => {
// 		let i = setInterval( dispatch, 200, );
// 		return () => clearInterval( i );
// 	},
// },
// ( action, signals ) => {
// 	// do something
// 	console.log( 'respond to a thing', action, signals );
// } );

console.log( 'app2', app2 );


process.title = 'fractal';