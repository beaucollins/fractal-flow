// @flow
import { createStore, applyMiddleware, compose } from 'redux';
import createIOServer from 'socket.io';
import setupSocket from './socket-io-api';
import type { API } from './api';
import type { UserAction } from './user/actions';
import type { UserEffect } from './user/effects';
import type { User } from './user/model';

type UserScore = {
	user: User,
	score: number
};

type Scoreboard = {
	[ userId: string ]: UserScore
};

type UserState = {
	user: User,
	score: number,
	scores: Scoreboard
}

type AppAction
	= AppUserAction
	| NothingAction;

type NothingAction = { type: 'NOTHING' };

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

const healing = () => next => action => {
	if ( ! action ) {
		return next( action );
	}
	if ( action.type === 'USER_ACTION' ) {
		if ( action.action.type === 'HEAL' ) {
			const user = action.user;
			const healedUserID = action.action.healedUserID;
			// 0. 
			// 1. dispatch the action that makes them heal
			// store.dispatch();
			// 2. dispatch the side-effect?
		}
	}
	return next( action );
};

const enhancer = compose( applyMiddleware( healing ) );
const store = createStore( scoreboardReducer, undefined, enhancer );

const io = createIOServer();

const authenticate = socket => new Promise( ( resolve ) => {
	socket.emit( 'user', ( user: User ) => {
		resolve( user );
	} );
} );

type Admin = { adminID: string };

const authenticateAdmin = socket => new Promise( resolve => {
	socket.emit( 'admin', ( admin: Admin ) => {
		resolve( admin );
	} );
} );

const api: API<User, UserState, UserAction> = {
	dispatch: ( user, action ) => {
		store.dispatch( { user, action, type: 'USER_ACTION' } );
		return action;
	},
	getState: async ( user ) => {
		const state = store.getState();
		return {
			user: user,
			score: state[ user.id ].score,
			scores: store.getState()
		};
	},
	subscribe: ( user, subscriber ) => {
		return store.subscribe( subscriber );
	}
};

type AdminState = {
	mock: string
}

type AdminAction = {

}

const adminAPI: API<Admin, AdminState, AdminAction> = {
	dispatch: ( admin, action ) => {
		return action;
	},
	getState: async ( admin ) => {
		return { mock: 'stuff' };
	},
	subscribe: ( admin, subscriber ) => {
		return store.subscribe( subscriber() );
	}
};

const admin = setupSocket( io.of( '/admin' ), authenticateAdmin, adminAPI );
const effectEmitter = setupSocket( io.of( '/game' ), authenticate, api );


/**
 * Compnent is one slice of functionality. Can we somehow combine compenents into
 * something higher-level that can communicate between the components either through
 * dispatching actions or notifying effects.
 *
 * Context - nebulous but it's where the compenent's actor starts. In Socket.IO this would be a socket
 */
type ComponentAPI<Context, ActorType, ActionType, EffectType, StateType> = {
	authenticate: (Context) => Promise<ActorType>;
	dispatch: (ActorType, ActionType) => Promise<?EffectType>;
	getState: (ActorType) => Promise<StateType>;
}

type Component = {
	mock: () => string
}

type Hero = {
	heroID: string
}

type Socket = any;



function createSocketIOComponent<Actor, Action, Effect, State>( namespace: any, api: ComponentAPI<Socket, Actor, Action, Effect, State> ) {
	namespace.on( 'connection', async ( socket ) => {
		const actor = await api.authenticate( socket );
		const state = await api.getState( actor );
		socket.emit( 'api.state', state );
		socket.on( 'api.dispatch', ( action: Action ) => {
			api.dispatch( actor, action );
		} );
	} );
	return ( dispatch ) => {
	};
}

type HeroAction = 'attack' | 'sleep';
type HeroEffect = 'heal' | 'die';

const heroes = createSocketIOComponent( io.of( '/users' ), {
	authenticate: socket => new Promise( resolve => {
		socket.emit( 'hello', ( hero: Hero ) => {
			resolve( hero );
		} );
	} ),
	dispatch: async (hero: Hero, action: HeroAction ): Promise<?HeroEffect> => {
		switch ( action ) {
		case 'attack':
			return 'die';
		
		default:
			break;
		}
		return null;
	},
	getState: async (hero: Hero) => {
		return {
			identity: hero,
			all: []
		};
	}
} );

// A component is a function that returns a dispatch function? You give it a function it can call to emit side effects?

const app = combineComponents( {
	heroes: ( component )
} );

io.listen( 3003 );