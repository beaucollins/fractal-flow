// @flow
import type { Component } from '../../fractal';

export type Signal = 'start' | 'stop';

const component: (number) => Component<number, Signal> = ( interval = 1000 ) => ( dispatcher ) => {
	let timer = null;
	const start = () => {
		if ( timer ) {
			return;
		}
		timer = setInterval( () => {
			dispatcher( Date.now() );
		}, interval );
	};
	const stop = () => {
		if ( timer ) clearInterval( timer );
	};
	return ( effect ) => {
		switch( effect ) {
		case 'start':
			start();
			break;
		case 'stop':
			stop();
			break;
		}
	};
};

export default component;