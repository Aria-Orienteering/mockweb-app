import React, { Component } from 'react'
import { connect } from 'react-redux';
import {getResultsThunk, watchResultsChangedEvent} from "../store/Store";


class Results extends Component {


    result(result) {
        return <div key={result.uid}>
            <p>{result.name} completed course {result.course} in {result.time}</p>
        </div>
    }

    render() {
        console.log("results", this.props.results);
        if (this.props.results.length > 0) {
            return this.props.results.map(i => this.result(i));
        } else {
            return <div>
                <p>No completed courses yet</p>
            </div>
        }
    }
}

const mapState = state => ({
    results: state.finished
});
const mapDispatch = dispatch => {
    dispatch(getResultsThunk());
    watchResultsChangedEvent(dispatch);
    return {
    }
};
export default connect(mapState, mapDispatch)(Results)