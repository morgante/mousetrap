import { Link } from "gatsby";
import PropTypes from "prop-types";
import React from "react";

class Start extends React.Component {
    render () {
        return (
            <a href="#" onClick={this.props.start}>Started</a>
        )
    }
}

export default Start;
