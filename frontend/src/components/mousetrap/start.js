import { Link } from "gatsby";
import PropTypes from "prop-types";
import React from "react";

class Start extends React.Component {
    state = {
        started: false,
    }

    start(e) {
        e.preventDefault();
        console.log("I have started");
    }

    render () {
        return (
            <a href="#" onClick={this.start}>Started</a>
        )
    }
}

export default Start;
