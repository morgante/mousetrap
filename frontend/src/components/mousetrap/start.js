import { Link } from "gatsby";
import PropTypes from "prop-types";
import React from "react";
import socketIOClient from "socket.io-client";

// const SOCKET_ENDPOINT = "http://localhost:8080";
const SOCKET_ENDPOINT = "https://clf-sbx-mousetrap.uk.r.appspot.com";

class Start extends React.Component {
    render () {
        return (
            <a href="#" onClick={this.props.start}>Started</a>
        )
    }
}

export default Start;
