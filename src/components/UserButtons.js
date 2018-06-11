import React, { Component } from 'react'
import { Button } from 'reactstrap'
import '../css/UserButton.css';
import logo from '../images/compass_icon.png';
import PubSub from 'pubsub-js'
import { connect } from 'react-redux';
import {getUsersThunk, watchUserChangedEvent} from "../store/Store";


const icon = <img src={logo} className="sm-logo" alt="logo"/>;
const leftIcon = <span aria-hidden="true" data-icon="+"/>;

export let activeUser;

class UserButtons extends Component {
    constructor(props) {
        super(props);

        this.state = {
            activeUser: null,
            name: ''

        };
        this.click = this.click.bind(this)

    }

    click(user, e) {
        // send callback to App or Redux?
        e.preventDefault();

        this.setState(prevState => { return {
            activeUser: user.uid,
            name: user.firstName
            }}, () => {PubSub.publish('user', user)});
    }

    button(user) {

        return <Button key={user.uid} className="bg-success" onClick={(e) => {this.click(user, e)}}>
            {icon}{user.firstName}{leftIcon}</Button>
    }

    render() {
                console.log("users", this.props.users);
                if (this.props.users.length > 0 ) {
                    return this.props.users.map(i => this.button(i));
                } else {
                    return <div><p>No Users</p></div>
                }
    }
}

const mapState = state => ({
    users: state.users
});
const mapDispatch = dispatch => {
    dispatch(getUsersThunk());
    watchUserChangedEvent(dispatch);
    return {
    }
};
export default connect(mapState, mapDispatch)(UserButtons);