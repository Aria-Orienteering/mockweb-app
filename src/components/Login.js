import React, {Component} from 'react'
import {MuiThemeProvider, RaisedButton} from "material-ui";
import GooglePlus from 'mui-icons/fontawesome/google-plus'
import {auth, provider} from '../firebase/firebase.js'

const iconStyles = {
    color: "#ffffff"
};

export let user

class Login extends Component {
    constructor() {
        super();
        this.state = {
            user: null,
        };
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
    }

    render() {
        return (
            <MuiThemeProvider>
                <div className="wrapper">
                    {this.state.user ?
                        <RaisedButton
                            label="Sign Out"
                            labelColor={"#ffffff"}
                            backgroundColor="#dd4b39"
                            icon={<GooglePlus style={iconStyles}/>}
                            onClick={this.logout}/>
                        :
                        <RaisedButton
                            label="Sign in with Google"
                            labelColor={"#ffffff"}
                            backgroundColor="#dd4b39"
                            icon={<GooglePlus style={iconStyles}/>}
                            onClick={this.login}/>
                    }
                </div>
            </MuiThemeProvider>
        )
    }

    handleChange(e) {
        /* ... */
    }
    logout() {
        auth.signOut()
            .then(() => {
                this.setState({
                    user: null,
                });
            });
    }
    login() {
        auth.signInWithPopup(provider)
            .then((result) => {
                const user = result.user;
                this.setState({
                    user
                });
            });
    }

    componentDidMount() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.setState({user});
            }
        });
    }
}

export default Login



