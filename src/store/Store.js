import {createStore, applyMiddleware} from 'redux'
import firebase from '../firebase/firebase'
import thunkMiddleware from 'redux-thunk'

/**
 * FIREBASE CONSTANTS
 */
const rootRef = firebase.database().ref();
const rootUsers = rootRef.child('users');
/**
 * ACTION TYPES
 */
const GET_USERS = 'get users';

/**
 * ACTION CREATORS
 */
export const getUsers = (users) => ({type: GET_USERS, users});

/**
 * THUNKS
 */
export function getUsersThunk() {
    return dispatch => {
        const users = [];
        rootUsers.once('value', snap => {
            snap.forEach(data => {
                let user = data.val();
                if (user.active) {
                    users.push(user)
                }
            })
        })
            .then(() => dispatch(getUsers(users)))
    }
}


/**
 * LISTENERS
 */
export function watchUserChangedEvent(dispatch) {
    rootUsers.on('child_changed', () => {
        dispatch(getUsersThunk());
    });
}

/**
 * REDUCER
 */
function Reducer (state = [], action) {
    switch (action.type) {
        case GET_USERS:
            return action.users;
        default:
            return state
    }
}

export default createStore(Reducer, applyMiddleware(thunkMiddleware))