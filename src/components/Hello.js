import React, { Component} from 'react' ;
import PubSub from  'pubsub-js'
import {getUsersThunk, watchUserChangedEvent} from "../store/Store";
import {connect} from "react-redux";

class Hello extends Component {
    constructor() {
        super();
        this.state = {
            selection: 'none',

        }
    }

    componentWillMount() {
        // React will mount me, I can subscribe to the topic 'products'
        // `.subscribe()` returns a token used to unsubscribe
        this.token = PubSub.subscribe('user', (topic, user) => {
            this.setState({selection: user});
        });
    }



    componentWillUnmount() {
        // React removed me from the DOM, I have to unsubscribe from the system using my token
        PubSub.unsubscribe(this.token);
    }


    box(i) {
        let user = this.props.users[i];
        return <div>
            <p>You have selected the user: {user.firstName}</p>
            <p>Longitude: {user.lon}</p>
            <p>Latitude: {user.lat}</p>
            {user.course_object != null &&
                <p>{user.firstName} is on course: {user.course_object.id}</p>
            }
        </div>
    }

    render() {
        let i = this.props.users.findIndex(i => i.firstName === this.state.selection.firstName)
        if (i > -1) {
            return this.box(i);
        } else {
            return <div>
                <p>You have selected no-one</p>
            </div>
        }
    }
}

const mapState = state => ({
    users: state
});
const mapDispatch = dispatch => {
    dispatch(getUsersThunk());
    watchUserChangedEvent(dispatch);
    return {
    }
};
export default connect(mapState, mapDispatch)(Hello);
