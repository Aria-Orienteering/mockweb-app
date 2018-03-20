import React, { Component } from 'react';
import logo from './images/compass_icon.png';
import './css/App.css';
import Hello from './components/Hello' ;
import MapContainer from './components/MapContainer';
import UserButton from './components/UserButton';
import { Card, Button, CardHeader, CardBody } from 'reactstrap'

const a = ['Jeff', 'Gemima', 'Teddy', 'Manu'];

class App extends Component {
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
                              <Hello/>
                              <div>
                                  {React.Children.map(a, i => <UserButton name={i}/>)}
                              </div>
                          </CardBody>
                          <Button className="bg-primary">Click Here</Button>
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
