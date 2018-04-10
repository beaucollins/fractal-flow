// @flow
export interface API<UserType, StateShape, ActionType> {
	getState( user: UserType ): Promise<StateShape>;
	dispatch( user: UserType, action: ActionType ): ActionType;
	subscribe( user: UserType, subscriber: () => any ): () => void;
}
