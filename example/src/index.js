// @flow
import type { Component, Dispatcher } from 'fractal';
import { createApp } from 'fractal';
import createIOServer from 'socket.io';
import type { SocketIOSocket } from './components/socket-io';
import createUserComponent from './components/users';
import type { User } from './components/users';
import timerComponent from './components/timer';
import createOperatorComponent from './components/operators';

const userAuthenticator = ( socket: SocketIOSocket ) => new Promise( resolve => {
	socket.emit( 'auth', ( user: User ) => {
		resolve( user );
	} );
} );

const io = createIOServer();

const users = createUserComponent(io.of('/users'), userAuthenticator);
const echo: Component<mixed, *> = dispatch => dispatch;
const timer = timerComponent( 1000 );
const operators = createOperatorComponent(io.of('/operators'));

const accumulator: Component<number, Dispatcher<number | 'reset'>> = dispatch => {
	let current = 0;
	return signal => {
		if ( signal === 'reset' ) {
			current = 0;
		} else {
			current += signal;
		}
		dispatch( current );
	};
};

const interval: Component<void, () => void> = dispatch => {
	let id = setInterval( dispatch, 100 );
	return () => {
		clearInterval( id );
	};
};

const app = createApp({users, operators, timer, echo, interval, accumulator});

const appSignals = app( {
	users: ( action, signals ) => {
		switch( action.action ) {
		case 'shrink':
			break;
		}
		signals.users( {
			type: 'sync',
			userID: action.user.id
		} );
	},
	operators: ( action, signals ) => {
		if ( action.type === 'broadcast' ) {
			signals.users( { type: 'broadcast', message: action.message } );
		}
	},
	timer: ( time, signals ) => {
		signals.users( { type: 'timer', time } );
		console.log( 'timer', time );
		signals.accumulator( 1 );
	},
	echo: ( action ) => {
		console.log( 'echoed >', action );
	},
	accumulator: ( action, signals ) => {
		console.log( 'accumulation', action );
		if ( action > 100 ) {
			signals.accumulator( 'reset' );
		}
	},
	interval: ( action ) => {
		console.log( 'interval' );
	}
} );

appSignals.timer.start();
appSignals.echo( 'hi' );

io.listen( 3003 );

process.title = 'fractal';