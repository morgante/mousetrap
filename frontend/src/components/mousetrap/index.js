import React from "react";
import socketIOClient from "socket.io-client";

import Start from "./start";

// const SOCKET_ENDPOINT = "http://localhost:8080";
const SOCKET_ENDPOINT = "https://clf-sbx-mousetrap.uk.r.appspot.com";

class Mousetrap extends React.Component {
    state = {
        session: ''
    }

    constructor(props) {
        super(props);
        this.socket = socketIOClient(SOCKET_ENDPOINT);

        this.state.session = 'cool-sess';

        this.socket.on('connect', (evt) => {
            this.socket.emit('start-session', this.state.session);
        });

        // This binding is necessary to make `this` work in the callback
        this.start = this.start.bind(this);
    }

    componentDidMount() {
        this.socket.on("datum", data => {
            console.log("chat", data);
        });
    }

    start(e) {
        e.preventDefault();
        console.log("I have started");
        this.socket.emit('datum', 'start plz');
    }

    render () {
        return (
            <Start start={this.start} />
        )
    }
}

export default Mousetrap;
