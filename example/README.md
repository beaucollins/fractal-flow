# Fractal

Bi-directional data flow for real time servers.

_Note:_ thisk

## Components: The Core Principal

The core of Fractal is a Component.

```js
type Dispatcher<Action> = (Action) => void;
type Component<Action, Signal> = (Dispatcher<Action>) => Signal => void;
```

A component is a function that receives a `Dispatcher`. A `Dispatcher` is how a component tells the outside world that it needs to do something.

Example time. Create a file `heroine.js`.

Imagine a `Component` that represents a charater in a game. Let's call her the `Heroine`.

```js
// @flow
import type { Component } from 'fractal';
type Action = void;
type Signal = void;
type HeroineComponent = Component<Action, Signal>;
```
And an implementation:

```js
const heroineComponent: HeroineComponent = ( dispatch ) => {
    return ( signal ) => {};
};
```

Let's try using it:

```js
const heroine = heroineComponent( action => {
    console.log( 'our heroine would like to', action );
} );
```


## What the heck is an `Action`

Our heroine needs to be able to change the world by acting in it. But right now she doesn't seem to be able to do anything. Let's give her something she can do by defining an action.

```js
type Action = { type: 'announce', name: string };
```

Now when we instantiate a heroine, we can have her announce her name:

```js
const heroineComponent = dispatch => {
    dispatch( { type: 'announce', name: 'Furiosa' } );
    return signal => {};
}
```

Time to run the script:

```
fractal (sample) $ babel-node src/example/components/heroine.js
our heroine:  { type: 'announce', name: 'Furiosa' }
```

Great now we know who she is. But is every heroine named _Furiosa_? I don't think so. We can make this something we can pass into the component:

```js

const heroineComponent: string => HeroineComponent = name => dispatch => {
	dispatch( { type: 'announce', name } );
	return ( signal ) => {

	};
};

const heroine = heroineComponent( 'Furiosa' )( action => {
	console.log( 'our heroine: ', action );
} );
```

Oh no, there's a gang of treacherous villains. How do we tell the heroine?

## Send out a `Signal`

To tell our `HeroineComponent` about danger she needs to be able to receive a signal. Time to define one:

```js
type Signal =  'danger' | 'calm';
```

We've indicated the type of `Signal`s we can send to our heroine:

```js
const heroine = heroineComponent( 'Furiosa' )( action => {
	console.log( 'our heroine: ', action );
} );

heroine( 'danger' );
```
Our heroine should respond to this `danger` `Signal`, she needs another action:

```js

type Action
	= { type: 'announce', name: string }
    | { type: 'defend' }
```

```js
const heroineComponent: string => HeroineComponent = name => dispatch => {
	dispatch( { type: 'announce', name } );
	return ( signal ) => {
        if ( signal === 'danger' ) {
            dispatch( { type: 'defend' } );
        }
	};
};
```

Run the script again and let's see what happens:

```
fractal (sample) $ babel-node src/example/components/heroine.js
our heroine:  { type: 'announce', name: 'Furiosa' }
our heroine:  { type: 'defend' }
```

## It's dangerous to go alone.

What's better than a heroine? A whole team, that's what. `Fractal` provides a higher order function that allows us to combine `Component` instances together.

Let's make a list of the heroines we will have on our team:

```js
import { combineComponents } from 'fractal';

let names = [
    'Furiosa',
    'Ripley',
    'Captain Marvel',
    'Scarlet Witch',
    'Arwen'
];

// heroineComponent is a function that takes a string for the name. We can
// map it!

let heroines = names.map( heroineComponent );

// user combineComponents

```




Nice. Our heroine will now defend when we she receives the `danger` `Signal`.

```js
const heroineComponent: string => HeroineComponent = name => dispatch => {
	dispatch( { type: 'announce', name } );
	return ( signal ) => {
		switch( signal ) {
		case 'danger':
			break;
		case 'calm':
			break;
		}
	};
};

type Action
    = { type: 'defend' }
    | { type: 'attack' }
    | { type: 'announce', name: string }
```

Ok, so the heroine can defend now but when should she defend. Obviously when there is danger. Let's add a way to `Signal` danger to our heroine:

```js
type Signal = { name: 'ambush', enemies: number };
```

If we return to our `heroineComponent` implementation `flow` now tells us the types of actions we can `dispatch` as well as the type of signals we can receive. Let's tell the heroine she is being ambushed by a gang of treacherous villains:

```js
const heroine = heroineComponent( action => {
    console.log( 'our heroine would like to', action );
} );

// Signal the heroine
heroine( { name: 'ambush', enemies: 10 } );
```
