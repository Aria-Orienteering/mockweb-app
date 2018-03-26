import React, { Component } from 'react'
import { Button } from 'reactstrap'
import '../css/UserButton.css';
import logo from '../images/compass_icon.png';

const icon = <img src={logo} className="sm-logo" alt="logo"/>;
const leftIcon = <span aria-hidden="true" data-icon="+"/>

class UserButton extends Component {
    constructor() {
        super();
        this.props = {
            name: ''
        }
    }


    render() {
        return (
            <Button className="bg-success">
                {icon}{this.props.name}{leftIcon}</Button>
        );
    }
}

export default UserButton