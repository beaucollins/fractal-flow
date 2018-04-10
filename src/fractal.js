// @flow
export type Activity<Actor, Action> = { actor: Actor, action: Action }
export type Dispatcher<Actor, Action> = (Activity<Actor, Action>) => void;
export type Signaler<Signal> = (Signal) => void;
export type Component<Actor, Action, Signal> = (Dispatcher<Actor, Action>) => Signaler<Signal>;

export function mapComponent<A1, Act1, Eff1, A2, Act2, Eff2>( mapActivity: (Activity<A1, Act1>) => Activity<A2, Act2>, mapEffect: Eff2 => ?Eff1, component: Component<A1, Act1, Eff1> ): Component<A2, Act2, Eff2> {
	return ( dispatcher: Dispatcher<A2, Act2> ) => {
		const handler = component( ( activity ) => {
			dispatcher( mapActivity( activity ) );
		} );
		return effect => {
			const result = mapEffect( effect );
			if ( result ) {
				handler( result );
			}
		};
	};
} 

export function combineComponents<Actor, Action, Effect >( ... components: Component<Actor, Action, Effect>[] ): Component<Actor, Action, Effect> {
	return ( dispatch: Dispatcher<Actor, Action> ) => {
		const all = components.map( component => component( dispatch ) );
		return effect => {
			all.map( handler => handler( effect ) );
		};
	};
}
