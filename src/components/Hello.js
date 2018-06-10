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
        // React will mount me, I can subscribe to the topic 'user'
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

            {user.courseObject != null &&
                <p>{user.firstName} is on course: {user.courseObject.id}</p>
            }
            {user.courseObject != null &&
                <p>{user.firstName} has found {this.foundMarkers(user.courseObject)} out of {user.courseObject.markers.length} markers</p>
            }
            {user.courseObject != null && (this.foundMarkers(user.courseObject) === user.courseObject.markers.length) &&
                <p>{user.firstName} is heading for home!</p>
            }
        </div>
    }

    foundMarkers(course) {
        let markers = course.markers;
        let foundCount = 0;
        markers.forEach(marker => {
            if(marker.status === "FOUND"){
                foundCount++
            }
        });
        return foundCount
    }



    render() {
        let i = this.props.users.findIndex(i => i.firstName === this.state.selection.firstName);
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
