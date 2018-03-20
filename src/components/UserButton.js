import React, { Component } from 'react'
import { Button } from 'reactstrap'
import '../css/UserButton.css';
import logo from '../images/compass_icon.png';

class UserButton extends Component {
    constructor() {
        super();
        this.props = {
            name: ''
        }
    }

    render() {
        return (
            <Button className="bg-success"><img src={logo} className="sm-logo" alt="logo"/>{this.props.name}</Button>
        );
    }
}

export default UserButton