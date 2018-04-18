// @flow
import type { Component } from 'fractal';

const component: (number) => Component<number, *> = ( interval = 1000 ) => ( dispatcher ) => {
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
	return {
		start,
		stop
	};
};

export default component;