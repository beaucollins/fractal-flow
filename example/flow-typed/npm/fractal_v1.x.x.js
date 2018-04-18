// flow-typed signature: 47d4d284d96d536de0acc3574bd0572e
// flow-typed version: <<STUB>>/fractal_v1.0.0

declare module 'fractal' {
  declare export type Dispatcher<T> = T => void | Promise<void>;
  declare export type Component<Action, Signal> = Dispatcher<Action> => Signal;
  declare export function mapComponent<A1, S1, A2, S2>( mapActivity: (A1) => A2, mapSignal: S1 => S2, component: Component<A1, S1> ): Component<A2, S2>;
  declare export function combineComponents<Action, Signal>( ... components: Component<Action, Signal>[] ): Component<Action, Signal[]>;
  declare export function createBufferedDispatcher<T, Action>( resolver: Promise<T>, dispatch: Dispatcher<Action> ): Dispatcher<T => ?Action>;

  declare type ExtractSignalType = <A, S>(Component<A, S>) => S;
  declare type ExtractAppDispatcher<T> = <A, S>(Component<A, S>) => (A, T) => void | Promise<void>;
  declare type ExtractActionType = <A, S>(Component<A, S>) => A;

  declare type CombinedDispatch<O: Object, T> = $ObjMap<O, ExtractAppDispatcher<T>>;
  declare type CombinedSignals<O: Object> = $ObjMap<O, ExtractSignalType>;
  declare type CombinedActions<O: Object> = $ObjMap<O, ExtractActionType>;

  declare export function createApp<O: Object>(components: O, middleware?: ( $Keys<O>, $Values<CombinedActions<O>>, () => Promise<void>, CombinedSignals<O> ) => any ): (CombinedDispatch<O, CombinedSignals<O>> ) => CombinedSignals<O>;
}

