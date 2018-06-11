import {createStore, combineReducers, applyMiddleware} from 'redux'
import firebase from '../firebase/firebase'
import thunkMiddleware from 'redux-thunk'

/**
 * FIREBASE CONSTANTS
 */
const rootRef = firebase.database().ref();
const rootUsers = rootRef.child('users');
const rootResults = rootRef.child('results');
/**
 * ACTION TYPES
 */
const GET_USERS = 'get users';
const GET_RESULTS = 'get results';

/**
 * ACTION CREATORS
 */
export const getUsers = (users) => ({type: GET_USERS, users});
export const getResults = (results) => ({type: GET_RESULTS, results});

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

export function getResultsThunk() {
    return dispatch => {
        const results = [];
        rootResults.once('value', snap => {
            snap.forEach(data => {
                let result = data.val();
                if (result.uid !== "test") {
                    results.push(result)
                }

            })
        })
            .then(() => dispatch(getResults(results)))
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

export function watchResultsChangedEvent(dispatch) {
    rootResults.on('child_changed', () => {
        dispatch(getResultsThunk());
    })
}

/**
 * REDUCER
 */
const users = function UserReducer (state = [], action) {
    switch (action.type) {
        case GET_USERS:
            return action.users;
        default:
            return state
    }
};

const finished = function ResultReducer(state = [], action) {
    switch (action.type) {
        case GET_RESULTS:
            return action.results;
        default:
            return state
    }
};

const combo = combineReducers({
    users, finished
});

export default createStore(combo, {}, applyMiddleware(thunkMiddleware))