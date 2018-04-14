// @flow
import type { Component } from './fractal';
import { createApp } from './fractal';

const add: number => Component<number, number> = amount => dispatch => signal => dispatch( signal + amount );
const greet: Component<string, string> = dispatch => signal => dispatch( 'hello, ' + signal );

const app = createApp(
	{ add: add( 1 ), greet }
);

const appSignals = app( {
	greet: ( action ) => {
		console.log( 'greet dispatched', action );
	},
	add: ( action, signals ) => {
		console.log( 'add dispatched', action );
		if ( action === 5 ) {
			signals.greet( 'five' );
		}
	}
} );

appSignals.add( 4 );