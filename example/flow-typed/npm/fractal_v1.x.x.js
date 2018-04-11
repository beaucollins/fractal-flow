// flow-typed signature: 47d4d284d96d536de0acc3574bd0572e
// flow-typed version: <<STUB>>/fractal_v1.0.0

declare module 'fractal' {
  declare export type Signaler<Signal> = (Signal) => void | Promise<void>;
  declare export type Dispatcher<Action> = Action => void | Promise<void>;
  declare export type Component<Action, Signal> = Dispatcher<Action> => Signaler<Signal>;
  declare export function mapComponent<A1, S1, A2, S2>( mapActivity: (A1) => A2, mapSignal: S2 => ?S1, component: Component<A1, S1> ): Component<A2, S2>;
  declare export function combineComponents<Action, Signal>( ... components: Component<Action, Signal>[] ): Component<Action, Signal>;
  declare export function createBufferedDispatcher<T, Action>( resolver: Promise<T>, dispatch: Dispatcher<Action> ): Dispatcher<T => Action>;
}
