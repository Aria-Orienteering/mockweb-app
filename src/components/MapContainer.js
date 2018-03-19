import React, { Component } from 'react'
import  GoogleMapReact from 'google-map-react'
import '../css/MapContainer.css'

// const AnyReactComponent = ({ text }) => <div>{ text }</div>;
const myLatLng = {lat: -38.560926, lng: 174.983468};

export default class MapContainer extends Component {
    static defaultProps = {
        options: {mapTypeControl: true,
            styles: [{ stylers: [{ 'saturation': -100 }, { 'gamma': 0.8 }, { 'lightness': 4 }, { 'visibility': 'on' }] }]
        }
    };

    static renderMarkers(map, maps) {
        return new maps.Marker({
            position: myLatLng,
            map,
            title: 'Aria Village'
        });

    }

    state = {
        center: [-38.560926, 174.983468],
        zoom: 14,
    };

    _onChange = ({center, zoom}) => {
        this.setState({
            center: center,
            zoom: zoom,
        });
    };

    render() {
        return (
            <div className='google-map'>
                <GoogleMapReact
                    bootstrapURLKeys={{ key: [process.env.REACT_APP_GOOGLE_MAP_API_KEY] }}
                    onChange={this._onChange}
                    center={this.state.center}
                    zoom={this.state.zoom}
                    options = {this.props.options}
                    onGoogleApiLoaded={({map, maps}) => this.renderMarkers(map, maps)}
                    >

                </GoogleMapReact>
            </div>
        )
    }
}



