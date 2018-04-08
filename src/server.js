// @flow
import { createStore } from 'redux';
import createIOServer from 'socket.io';
import setupSocket from './api';
import type { UserAPI } from './api';
import type { UserAction } from './actions';

type UserScore = {
	user: User,
	score: number
};

type Scoreboard = {
	[ userId: string ]: UserScore
};

type User = { id: string };
type UserState = {
	user: User,
	score: number,
	scores: Scoreboard
}

type AppAction
	= AppUserAction;

type AppUserAction = {
	type: 'USER_ACTION',
	user: User,
	action: UserAction
}

type AppState = Scoreboard;

const scoreReducer = ( state: ?UserScore, action: AppAction ) => {
	switch (action.type) {
	case 'USER_ACTION':
		switch ( action.action.type ) {
		case 'INCREMENT':
			console.log( 'user action', action, state );
			return {
				user: action.user,
				score: ( state && state.score ? state.score : 0 ) + ( action.action.amount || 1 )
			};						
		}
	}
};

const scoreboardReducer = ( state: AppState = {}, action: AppAction ) => {
	switch ( action.type ) {
	case 'USER_ACTION':
		return {
			... state,
			[ action.user.id ]: scoreReducer( state[action.user.id], action )
		};
	}
	return state;
};
const store = createStore( scoreboardReducer );

const io = createIOServer();

const authenticate = socket => new Promise( ( resolve ) => {
	socket.emit( 'user', ( user: User ) => {
		resolve( user );
	} );
} );


const api: UserAPI<User, UserState, UserAction> = {
	dispatch: ( user, action ) => {
		store.dispatch( { user, action, type: 'USER_ACTION' } )
		console.log( 'user dispatched', user.id, action );
		return action;
	},
	getState: async ( user ) => {
		return {
			user: user,
			score: 0,
			scores: store.getState()
		};
	},
	subscribe: ( user, subscriber ) => {
		return store.subscribe( subscriber );
	}
};


io.on( 'connection', socket => {
	setupSocket( socket, authenticate, api );
} );

io.listen( 3003 );