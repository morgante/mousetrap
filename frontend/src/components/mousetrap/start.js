import { Link } from "gatsby";
import PropTypes from "prop-types";
import React from "react";
import socketIOClient from "socket.io-client";

// const ENDPOINT = "https://clf-sbx-mousetrap.uk.r.appspot.com";
const SOCKET_ENDPOINT = "http://localhost:8080";

class Start extends React.Component {
    state = {
        started: false,
        session: 'cool-sess'
    }

    constructor(props) {
        super(props);
        this.socket = socketIOClient(SOCKET_ENDPOINT);

        this.socket.on('connect', (evt) => {
            this.socket.emit('start-session', this.state.session);
            // console.log("joined session", this.socket);
            // this.socket.join('cool-sess');
        });

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

        // io.to(`${message.session}`).emit('datum', message.data);

        // this.socket.emit('start-session', 'cool-sess');
    }

    render () {
        return (
            <a href="#" onClick={this.start}>Started</a>
        )
    }
}

export default Start;
