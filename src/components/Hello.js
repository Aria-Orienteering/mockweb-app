import React, { Component} from 'react' ;
import PubSub from  'pubsub-js'

class Hello extends Component {
    constructor() {
        super();
        this.state = {
            selection: 'none'
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

    render() {
        return <div>You have selected the user: {this.state.selection.firstName}</div>
    }
}

export default Hello;
