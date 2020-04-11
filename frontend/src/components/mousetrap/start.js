import { Link } from "gatsby";
import PropTypes from "prop-types";
import React from "react";
import socketIOClient from "socket.io-client";

class Start extends React.Component {
    state = {
        started: false
    }

    constructor(props) {
        super(props);
        this.socket = socketIOClient("https://clf-sbx-mousetrap.uk.r.appspot.com");

        // This binding is necessary to make `this` work in the callback
        this.start = this.start.bind(this);
    }

    componentDidMount() {
        const { endpoint } = this.state;
        this.socket.on("datum", data => {
            console.log("chat", data);
            // this.setState({ response: data})
        });
    }

    start(e) {
        e.preventDefault();
        console.log("I have started");
        this.socket.emit('datum', 'start plz');
    }

    render () {
        return (
            <a href="#" onClick={this.start}>Started</a>
        )
    }
}

export default Start;
