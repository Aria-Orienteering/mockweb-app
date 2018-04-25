import React, { Component } from 'react';
import logo from './images/compass_icon.png';
import './css/App.css';
import Login from './components/Login' ;
import MapContainer from './components/MapContainer';
import UserButton from './components/UserButton';
import { Card, CardHeader, CardBody } from 'reactstrap'
import firebase from 'firebase'


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
            firstName: [],
        }
    }

    componentDidMount() {
        const rootRef = firebase.database().ref();
        const users = rootRef.child('users');

        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('user changed..', user);
                this.listenUsers(users)
            } else {
                // No user is signed in.
                this.setState({
                    firstName: [],
                })
            }
        });
    }

    listenUsers(users) {
        users.on('value', snap => {

            this.setState({
                firstName: []
            });

            snap.forEach(child => {
                this.setState({
                    users: this.state.users.concat([child.key]),
                    firstName: this.state.firstName.concat([child.val().firstName])
                });

            });
        });
    }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Aria Orienteering</h1>
        </header>
          <div className="container-fluid">
              <div className="row">
                  <div className="col-sm-3">
                      <Card>
                          <div className="bg-info clearfix">
                            <CardHeader>User List</CardHeader>
                          </div>
                          <CardBody>
                              <Login/>
                                  <div className="userList">
                                      {React.Children.map(this.state.firstName, i => <UserButton name={i}/>)}
                                  </div>
                          </CardBody>
                      </Card>
                  </div>
                  <div className="col-sm-9">
                      <Card>
                          <div className="bg-info clearfix">
                              <CardHeader>Orienteering Map</CardHeader>
                          </div>
                          <CardBody>
                              <MapContainer/>
                          </CardBody>
                      </Card>
                  </div>
            </div>
          </div>
      </div>

    );
  }
}

export default App;
