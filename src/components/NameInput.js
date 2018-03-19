import React, { Component } from 'react';

class NameInput extends Component {
    render() {
        return (
            <div className="form-group">
                <label form="name">Name: </label>
                <input id="name" value={this.props.name} onChange={this.props.onChange} />
            </div>
        );
    }
}

export default NameInput