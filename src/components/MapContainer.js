import React, { Component } from 'react'
import  GoogleMapReact from 'google-map-react'
import '../css/MapContainer.css'
import PubSub from "pubsub-js";
import {getUsersThunk, watchUserChangedEvent} from "../store/Store";
import {connect} from "react-redux";

// const AnyReactComponent = ({ text }) => <div>{ text }</div>;
let myLatLng = {lat: -38.560926, lng: 174.983468};

class MapContainer extends Component {
    static defaultProps = {
        options: {mapTypeControl: true,
            styles: [{ stylers: [{ 'saturation': -100 }, { 'gamma': 0.8 }, { 'lightness': 4 }, { 'visibility': 'on' }] }]
        }
    };
    constructor() {
        super();
        this.state = {
            center: [-38.560926, 174.983468],
            zoom: 14,
            selection: '',
        };
    }

    renderMarkers(map, maps) {
        return new maps.Marker({
            position: myLatLng,
            map,
            title: 'Aria Village'
        });
    }

    renderUser(map, maps) {
        console.log('In Render User');
        let i = this.props.users.findIndex(i => i.firstName === this.state.selection.firstName)
        if (i > -1) {
            let user = this.props.users[i];
            let userLatLng = {lat: user.lat, lng: user.lon};
            map.add(maps.Marker({
                position: userLatLng,
                map,
                title: user.firstName
            }));
        } else {
            return null
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

    _onChange = ({center, zoom}) => {
        this.setState({
            center: center,
            zoom: zoom,
        });
    };


    render() {
        const markers = ({map, maps}) => this.renderMarkers(map, maps);
        let users = ({map, maps}) => this.renderUser(map, maps);
        return (
            <div className='google-map'>
                <GoogleMapReact
                    bootstrapURLKeys={{ key: [process.env.REACT_APP_GOOGLE_MAP_API_KEY] }}
                    onChange={this._onChange}
                    center={this.state.center}
                    zoom={this.state.zoom}
                    options = {this.props.options}
                    onGoogleApiLoaded={markers}
                    >
                    {users}
                </GoogleMapReact>
            </div>
        )
    }
}
const mapState = state => ({
    users: state
});
const mapDispatch = dispatch => {
    dispatch(getUsersThunk());
    watchUserChangedEvent(dispatch);
    return {
    }
};

export default connect(mapState, mapDispatch)(MapContainer)
