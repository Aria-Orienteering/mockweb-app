import React, { Component } from 'react'
import ReactDOM from 'react-dom';
import '../css/MapContainer.css'
import PubSub from "pubsub-js";
import {getUsersThunk, watchUserChangedEvent} from "../store/Store";
import {connect} from "react-redux";

// const AnyReactComponent = ({ text }) => <div>{ text }</div>;
let myLatLng = {lat: -38.560926, lng: 174.983468};
let marker;
let courseMarkers = [];

class MapContainer extends Component {
    static defaultProps = {
        options: {mapTypeControl: true,
            styles: [{ stylers: [{ 'saturation': -100 }, { 'gamma': 0.8 }, { 'lightness': 4 }, { 'visibility': 'on' }] }]
        },
        symbol: {

        },
    };

    constructor() {
        super();
        this.state = {
            center: [-38.560926, 174.983468],
            zoom: 14,
            selection: '',
        };

    }

    renderFixedMarkers(map, maps) {
        return new maps.Marker({
            position: myLatLng,
            map,
            title: 'Aria Village'
        });
    }

    renderUser() {
        let maps = this.props.google.maps;
        if (marker) {
            marker.setMap(null);
        }
        let symbol = {
            path: maps.SymbolPath.CIRCLE,
            fillColor: 'cyan',
            fillOpacity: 0.6,
            strokeColor: 'white',
            strokeOpacity: 0.9,
            strokeWeight: 1.5,
            scale: 5
        };

        let i = this.props.users.findIndex(i => i.firstName === this.state.selection.firstName);
        if (i > -1) {
            console.log('In Render User');
            let user = this.props.users[i];
            let userLatLng = {lat: user.lat, lng: user.lon};
            marker = new maps.Marker({
                position: userLatLng,
                map: this.map,
                title: user.firstName,
                icon: symbol,
            });

            marker.setMap(this.map);

            if (user.courseObject != null) {
                this.addCourseMarkers(this.map, maps, user.courseObject)
            }

        } else {
            return null;
        }

    }

    addCourseMarkers(map, maps, course) {

        if (courseMarkers.length > 0) {
            courseMarkers.forEach(marker => marker.setMap(null));
        }
        courseMarkers = [];
        course.markers.map(mark => this.addMarker(mark,map, maps));
    }

    addMarker(mark, map, maps) {
        let newMark = new maps.Marker({
            position: {lat: mark.lat, lng: mark.lon},
            map: map,
            icon: this.statusSymbol(mark.status, maps)
        });
        newMark.setMap(map);
        courseMarkers.push(newMark);
    }

    statusSymbol(status, maps) {
        console.log("status is :",status)
        if(status === "NOT_FOUND") {
            return {
                path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
                fillColor: 'yellow',
                fillOpacity: 0.6,
                strokeColor: 'white',
                strokeOpacity: 0.9,
                strokeWeight: 1.5,
                scale: 5
            }
        } else if (status === "FOUND") {
            return {
                path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
                fillColor: 'green',
                fillOpacity: 0.6,
                strokeColor: 'white',
                strokeOpacity: 0.9,
                strokeWeight: 1.5,
                scale: 5
            }
        } else if (status === "TARGET") {
            return {
                path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
                fillColor: 'orange',
                fillOpacity: 0.6,
                strokeColor: 'white',
                strokeOpacity: 0.9,
                strokeWeight: 1.5,
                scale: 5
            }
        }
    }


    componentWillMount() {
        // React will mount me, I can subscribe to the topic 'products'
        // `.subscribe()` returns a token used to unsubscribe
        this.token = PubSub.subscribe('user', (topic, user) => {
            this.setState({selection: user});
        });

    }

    componentDidMount() {
        this.loadMap()
    }

    componentWillUnmount() {
        // React removed me from the DOM, I have to unsubscribe from the system using my token
        PubSub.unsubscribe(this.token);
    }

    componentDidUpdate() {
        this.renderUser();
    }

    loadMap() {
        if (this.props && this.props.google) { // checks to make sure that props have been passed

            const {google} = this.props; // sets props equal to google
            const maps = google.maps; // sets maps to google maps props

            const mapRef = this.refs.map; // looks for HTML div ref 'map'. Returned in render below.
            const node = ReactDOM.findDOMNode(mapRef); // finds the 'map' div in the React DOM, names it node

            const mapConfig = Object.assign({}, {
                center: myLatLng, // sets center of google map to Aria.
                zoom: 12, // sets zoom. Lower numbers are zoomed further out.
                mapTypeId: 'hybrid' // optional main map layer. Terrain, satellite, hybrid or roadmap--if unspecified, defaults to roadmap.
            });


            this.map = new maps.Map(node, mapConfig); // creates a new Google map on the specified node (ref='map') with the specified configuration set above.

            // ==================
            // ADD MARKERS TO MAP
            // ==================
            this.renderFixedMarkers(this.map,maps);
            this.renderUser();
        }
    }

    _onChange = ({center, zoom}) => {
        this.setState({
            center: center,
            zoom: zoom,
        });
    };


    render() {
        const style = { // MUST specify dimensions of the Google map or it will not work. Also works best when style is specified inside the render function and created as an object
            width: '66vw', // 90vw basically means take up 90% of the width screen. px also works.
            height: '66vh' // 75vh similarly will take up roughly 75% of the height of the screen. px also works.
        }

        return (
            <div ref="map" style={style}>
                loading map...
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
