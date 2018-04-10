// @flow
/* eslint-disable no-console */
import type { Component } from '../fractal';
import { mapComponent, combineComponents } from '../fractal';
import createIOServer from 'socket.io';
import createRedisAdapter from 'socket.io-redis';
import createUserComponent from './components/users';
import type { User, Action as UserAction, Signal as UserSignal } from './components/users';
import type { Signal as TimerSignal } from './components/timer';
import timerComponent from './components/timer';
import createOperatorComponent from './components/operators';
import type { OperatorAction, OperatorSignal } from './components/operators';

const userAuthenticator = ( socket: any ) => new Promise( resolve => {
	socket.emit( 'auth', ( user: User ) => {
		console.log( 'we have a user', user );
		resolve();
	} );
} );

const io = createIOServer( { adapter: createRedisAdapter() } );

// These are things that the components actors do to the app
type Action
	= UserComponentAction
	| { component: 'operator', action: OperatorAction }
	| TimerComponentAction;

type UserComponentAction = { action: UserAction, type: 'USER' };
type TimerComponentAction = { time: number, type: 'TIMER' };

// These are things that the app does to the component's actors
type Signal
	= UserComponentSignal
	| OperatorComponentSignal
	| TimerComponentSignal;

type UserComponentSignal = { type: 'USER', signal: UserSignal };
type TimerComponentSignal = { type: 'TIMER', signal: TimerSignal };
type OperatorComponentSignal = { type: 'operator', signal: OperatorSignal };

type AppComponent = Component<Action, Signal>;

const users: AppComponent = mapComponent(
	action => ( { type: 'USER', action } ),
	signal => {
		// ignoring all effects
		if ( signal.type === 'USER' ) {
			return signal.signal;
		}
	},
	createUserComponent(io.of('/users'), userAuthenticator)
);

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
			console.log( 'operator wants to do something', action );
			appDispatcher( { component: 'operator', action } );
		} );
		return ( signal ) => {
			// do something to the operators
			if ( signal.type === 'operator' ) {
				operatorSignaler();				
			}
		};
	}
);

// this is were actors within the application send their attempts to
// do something within the application
const signal = appComponent( action => {
	// we can call effects here now if we want to generate our own sideffects
	// we can call the effects whenever whe want
	if( action.type && action.type === 'TIMER' ) {
		signal( { type: 'USER', signal: {
			type: 'emit', name: 'effect', args: [ action.time ? action.time : undefined ]
		} } );
		return;
	}

	console.log( 'uhandled dispatch', action );
} );

signal( { type: 'TIMER', signal: 'start' } );

io.listen( 3003 );

process.title = 'fractal';