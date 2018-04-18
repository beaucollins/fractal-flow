// @flow
import type { Component, Dispatcher } from './fractal';
import { createApp } from './fractal';

const accumulator: Component<number, Dispatcher<number>> = ( dispatch ) => ( signal: number ) => dispatch( signal + 1 );
const interval: Component<void, void> = dispatch => {
	setInterval( dispatch, 1000 );
};

const measure = async ( component, action, exec, signals ) => {
	const start = Date.now();
	await exec();
	console.log( component, action, 'time', Date.now() - start );
};

const app = createApp( { accumulator, interval }, measure );
const wait = ( ms = 1000 ) => new Promise( ( resolve ) => {
	setTimeout( resolve, ms );
} );

app( {
	accumulator: ( amount, signals ) => {
        
	},
	interval: async ( action, signals ) => {
		await wait();
		console.log( 'interval' );
		signals.accumulator( 5 );
	}
} );