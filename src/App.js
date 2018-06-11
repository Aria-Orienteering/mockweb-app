import React, { Component } from 'react';
import logo from './images/compass_icon.png';
import './css/App.css';
import Login from './components/Login' ;
// import the Google Maps API Wrapper from google-maps-react
import { GoogleApiWrapper } from 'google-maps-react'
// import child component
import MapContainer from './components/MapContainer';
import UserButtons from './components/UserButtons';
import Results from './components/Results';
import Hello from './components/Hello';
import { Card, CardHeader, CardBody, CardFooter } from 'reactstrap'
import firebase from 'firebase'

// models


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "",
        };
    }

    componentDidMount() {

        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log('Logged in:', user.displayName);
            } else {
                // No user is signed in.
                console.log('Not logged in');
            }
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
                                      <UserButtons/>
                                  </div>
                          </CardBody>
                          <CardFooter><Hello name={this.state.name}/></CardFooter>
                      </Card>
                      <Card>
                          <div className="bg-info clearfix">
                              <CardHeader>Results</CardHeader>
                          </div>
                          <CardBody>
                              <Results/>
                          </CardBody>
                      </Card>
                  </div>
                  <div className="col-sm-9">
                      <Card>
                          <div className="bg-info clearfix">
                              <CardHeader>Orienteering Map</CardHeader>
                          </div>
                          <CardBody>
                              <MapContainer google={this.props.google}/>
                          </CardBody>
                      </Card>
                  </div>
            </div>
          </div>
      </div>

    );
  }
}

export default GoogleApiWrapper({
    apiKey: [process.env.REACT_APP_GOOGLE_MAP_API_KEY]
})(App);
