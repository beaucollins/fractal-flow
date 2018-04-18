// @flow
/* eslint-disable no-console */
import { combineComponents } from 'fractal';
import type { Component, Dispatcher } from 'fractal';

type Action
	= { type: 'announce', name: string }
	| { type: 'defend' }

type Signal =  'danger' | 'calm';

type HeroineComponent = Component<Action, Dispatcher<Signal>>;

const createHeroineComponent: string => HeroineComponent = name => dispatch => {
	dispatch( { type: 'announce', name } );
	return ( signal ) => {
		switch( signal ) {
		case 'danger':
			dispatch( { type: 'defend' } );
			break;
		case 'calm':
			break;
		}
	};
};

let names = [
	'Furiosa',
	'Ripley',
	'Captain Marvel',
	'Scarlet Witch',
	'Arwen'
];

const logAction = action => console.log( 'action >', action );

console.log( 'assemble team:' );
const teamComponent: HeroineComponent = ( dispatcher ) => {
	const components = combineComponents( ... names.map( createHeroineComponent ) );
	const all = components( dispatcher );
	return ( signal ) => {
		all.forEach( member => member( signal ) );
	};
};

const team = teamComponent( logAction );

console.log( 'signal danger:' );
team( 'danger' );