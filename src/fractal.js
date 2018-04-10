// @flow
export type Dispatcher<Action> = (Action) => void;
export type Signaler<Signal> = (Signal) => void;
export type Component<Action, Signal> = (Dispatcher<Action>) => Signaler<Signal>;

export function mapComponent<A1, S1, A2, S2>( mapActivity: (A1) => A2, mapSignal: S2 => ?S1, component: Component<A1, S1> ): Component<A2, S2> {
	return ( dispatcher: Dispatcher<A2> ) => {
		const handler = component( ( activity ) => {
			dispatcher( mapActivity( activity ) );
		} );
		return signal => {
			const result = mapSignal( signal );
			if ( result ) {
				handler( result );
			}
		};
	};
} 

export function combineComponents<Action, Signal>( ... components: Component<Action, Signal>[] ): Component<Action, Signal> {
	return ( dispatch: Dispatcher<Action> ) => {
		const all = components.map( component => component( dispatch ) );
		return effect => {
			all.map( handler => handler( effect ) );
		};
	};
}
