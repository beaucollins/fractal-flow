// @flow
/* eslint-disable no-console */
import type { Component, Activity } from '../fractal';
import { mapComponent, combineComponents } from '../fractal';
import createIOServer from 'socket.io';
import createRedisAdapter from 'socket.io-redis';
import createUserComponent from './components/users';
import type { User, Action as UserAction, Effect as UserEffect } from './components/users';
import type { Effect as TimerEffect } from './components/timer';
import timerComponent from './components/timer';
import createOperatorComponent from './components/operators';

const userAuthenticator = ( socket: any ) => new Promise( resolve => {
	socket.emit( 'auth', ( user: User ) => {
		console.log( 'we have a user' );
		resolve( user );
	} );
} );

const io = createIOServer( { adapter: createRedisAdapter() } );

type App = { app: 'an app' };

// These are things that the components actors do to the app
type Action
	= UserComponentAction
	| TimerComponentAction;

type UserComponentAction = { activity: Activity<User, UserAction>, type: 'USER_COMPONENT' };
type TimerComponentAction = { activity: Activity<void, number>, type: 'TIMER' };

// These are things that the app does to the component's actors
type Effect
	= UserComponentEffect
	| TimerComponentEffect;

type UserComponentEffect = { type: 'USER_COMPONENT', effect: UserEffect };
type TimerComponentEffect = { type: 'TIMER', effect: TimerEffect };

const app = { app: 'an app' };

type AppComponent = Component<App, Action, Effect>;

const users: AppComponent = mapComponent(
	activity => ( { actor: app, action: { type: 'USER_COMPONENT', activity } } ),
	( effect ) => {
		// ignoring all effects
		if ( effect.type === 'USER_COMPONENT' ) {
			return effect.effect;
		}
	},
	createUserComponent(io.of('/users'), userAuthenticator)
);

const appComponent: Component<App, Action, Effect> = combineComponents(
	users,
	mapComponent(
		activity => ( { actor: app, action: { type: 'TIMER', activity } } ),
		effect => {
			if ( effect.type === 'TIMER' ) {
				return effect.effect;
			}
		},
		timerComponent( 1000 )
	),
	appDispatcher => {
		const operatorComponent = createOperatorComponent( io.of('/operator') );
		const operatorSignaler = operatorComponent( activity => {
			console.log( 'operator wants to do something', activity, activity.actor );
		} );
		return ( signal ) => {
			// do something to the operators
			if ( signal ) {
				new Error( 'uhandled signal: ' );
			}
		};
	}
);

// this is were actors within the application send their attempts to
// do something within the application
const signal = appComponent( activity => {
	const action = activity.action;

	// we can call effects here now if we want to generate our own sideffects
	// we can call the effects whenever whe want
	if( action.type === 'TIMER' ) {
		signal( { type: 'USER_COMPONENT', effect: {
			type: 'emit', name: 'effect', args: [ action.activity.action ]
		} } );
		return;
	}

	console.log( 'uhandled dispatch', action );
} );

signal( { type: 'TIMER', effect: 'start' } );

io.listen( 3003 );

process.title = 'fractal';