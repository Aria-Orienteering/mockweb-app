import React, { Component} from 'react' ;
import NameList from './NameList';
import NameInput from './NameInput';

class Hello extends Component {
    constructor() {
        super();
        this.state = {
            name: {
                to: ''
            }
        }
    }

    changeName(e) {
        this.setState({name: { to: e.target.value }})
    }

    render() {
        return (
            <div className="Hello">
                <NameInput value={this.state.name} onChange={this.changeName.bind(this)} />
                <p>
                    Hello <NameList name={this.state.name}/>, This is where the user information will go
                </p>
            </div>
        )
    }

}

export default Hello;