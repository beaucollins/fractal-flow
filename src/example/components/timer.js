// @flow
import type { Component } from '../../fractal';

export type Effect = 'start' | 'stop';

const component: (number) => Component<void, number, Effect> = ( interval = 1000 ) => ( dispatcher ) => {
	let timer = null;
	const start = () => {
		if ( timer ) {
			return;
		}
		timer = setInterval( () => {
			dispatcher( { actor: undefined, action: Date.now() } );
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