import React from "react";
import socketIOClient from "socket.io-client";
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import update from 'immutability-helper';

import Start from "./start";
import Scene, { BALL_COLORS } from "./scene";

// const SOCKET_ENDPOINT = "http://localhost:8080";
const SOCKET_ENDPOINT = "https://clf-sbx-mousetrap.uk.r.appspot.com";
// const ENTRY_ENDPOINT = "http://localhost:8080";
const ENTRY_ENDPOINT = "https://entrypoint-otjmhzo3da-uk.a.run.app";

class Mousetrap extends React.Component {
    state = {
        session: '',
        balls: {},
        events: []
    }

    constructor(props) {
        super(props);
        this.socket = socketIOClient(SOCKET_ENDPOINT);

        this.state.session = uuid();

        this.socket.on('connect', (evt) => {
            console.log("socket connected");
            this.socket.emit('start-session', this.state.session);
        });

        // This binding is necessary to make `this` work in the callback
        this.start = this.start.bind(this);
    }

    componentDidMount() {
        this.socket.on("datum", data => {
            console.log("received event", data);
            this.setState(update(this.state, {
                events: {$push: [data]}
            }));
        });
    }

    start(e) {
        e.preventDefault();

        const ball = {
            id: uuid(),
            color: _.sample(BALL_COLORS),
            stage: "entrypoint_wait"
        };

        this.setState({
            balls: {
                ...this.state.balls,
                [ball.id]: ball
            }
        });

        setTimeout(() => {
            this.setState({
                balls: {
                    ...this.state.balls,
                    [ball.id]: {
                        ...this.state.balls[ball.id],
                        stage: "entrypoint_start",
                    },
                }
            });
        }, 2000);

        setTimeout(() => {
            this.setState({
                balls: {
                    ...this.state.balls,
                    [ball.id]: {
                        ...this.state.balls[ball.id],
                        stage: "entrypoint_done",
                    },
                }
            });
        }, 4000);

        fetch(ENTRY_ENDPOINT, {
            method: 'POST',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session: this.state.session,
                ...ball
            })
        }).then((response) => {
            return response.json();
        }).then((data) => {
            console.log("Response from entrypoint", data);
        });
    }

    render () {
        return (
            <div>
                <Start start={this.start} />
                <Scene balls={this.state.balls} />
            </div>
        )
    }
}

export default Mousetrap;
