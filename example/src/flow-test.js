// @flow
/* eslint-disable no-console */
import type { Component, Dispatcher } from 'fractal';
import { createApp } from 'fractal';

const hello: Component<string, *> = dispatcher => {
	// dispatcher( 'hello' );
	return ( signal: string ) => {
		console.log( 'hello signal', signal );
		dispatcher( signal.toUpperCase() );
	};
};

const goodbye: Component<number, *> = dispatcher => {
	// dispatcher( 6 );
	return ( signal: number ) => {
		console.log( 'goodbye', signal );
		dispatcher( signal + 1 );
	};
};

const funny: Component<boolean, Dispatcher<Object>> = () => () => {};

type CustomAction = { type: 'custom', value: string };
type CustomSignal = { type: 'custom', signalValue: string };

const custom: Component<CustomAction, Dispatcher<CustomSignal>> = () => () => {};

const components = { hello, goodbye, funny, custom };

const appInit = createApp( components );

const dispatch = {
	custom: ( action, signals ) => {
		console.log( 'custom dispatched', action );
		signals.funny( {} );
	},
	hello: ( action, signals ) => {
		console.log( 'hello dispatched', action );
		signals.goodbye( 4 );
	},
	goodbye: ( action, signals ) => {
		console.log( 'goodbye dispatched', action );
		setTimeout( async () => {
			await signals.hello( 'b' );
		}, 1000 );
	},
	funny: ( action, signal ) => {
		console.log( 'funny dispatched', action );
		signal.goodbye( 1 );
	}
};

const appSignals = appInit( dispatch );

setInterval( () => {
	appSignals.custom( { type: 'custom', signalValue: 'hi' } );
	appSignals.funny( {} );
	appSignals.goodbye(1);
	appSignals.hello( 'a' );
} );

process.title = 'fractal';
