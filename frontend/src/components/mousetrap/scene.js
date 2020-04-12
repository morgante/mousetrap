import PropTypes from "prop-types";
import React from "react";
import Matter, { Body, Bodies, Composite, Events, World, Common } from "matter-js";
import _ from 'lodash'

const ballColors = {
    'green': '#C7F464',
    'red': '#C44D58',
};
export const BALL_COLORS = _.keys(ballColors);

const ballStages = {
    default: 0x0001,
    box_blocked: 0x0002,
    box_enter: 0x0004,
};

function collissionMask(stage) {
    return ballStages["default"] | ballStages[stage];
}

function collisionCategory(ball, ballState) {
    console.log("get collission category", ball, ballState);
    switch (ball.stage) {
        case "entrypoint_wait":
            return ballStages["box_blocked"];
        case "entrypoint_start":
            if (ballState.boxed) {
                return ballStages["box_blocked"];
            } else {
                return ballStages["box_enter"];
            }
        default:
            return ballStages["default"];
    }
}

class Scene extends React.Component {
    state = {
        balls: {}
    }

    componentDidMount() {
        const engine = Matter.Engine.create({});
        const world = engine.world;

        const scale = {
            x: 0.5,
            y: 1
        };

        const render = Matter.Render.create({
            element: this.refs.scene,
            engine: engine,
            options: {
              width: scale.x * 800,
              height: 600,
              wireframes: false,
              showAngleIndicator: true
            }
        });

        World.add(engine.world, [
            Bodies.rectangle(scale.x * 200, 150, scale.x * 500, 20, { isStatic: true, angle: Math.PI * 0.06 }),
            Bodies.rectangle(scale.x * 600, 350, scale.x * 500, 20, { isStatic: true, angle: -Math.PI * 0.06 }),
            Bodies.rectangle(scale.x * 200, 480, scale.x * 500, 20, { isStatic: true, angle: Math.PI * 0.06 }),
        ]);

        // Add a sensor
        const addBox = (x, y, width, height, opts) => {
            const options = {
                isStatic: true,
                render: {
                    strokeStyle: ballColors['red'],
                    lineWidth: 1
                },
                ...opts
            };

            World.add(world, [
                Bodies.rectangle(x, y - (height / 2), width, 1, options),
                Bodies.rectangle(x, y + (height / 2), width, 1, options),
                Bodies.rectangle(x - (width / 2), y, 1, height, options),
                Bodies.rectangle(x + (width / 2), y, 1, height, options)
            ]);

            var sensor = Bodies.rectangle(x, y, width - 50, height - 50, {
                isSensor: true,
                isStatic: true,
                render: {
                    lineWidth: 1
                }
            });

            World.add(world, sensor);
            return sensor;
        }

        const enterBox = (box_name, body) => {
            const ballState = this.state.balls[body.label];
            console.log("enter box", body, ballState);

            this.setState({
                balls: {
                    ...this.state.balls,
                    [ballState.ball]: {
                        ...ballState,
                        boxed: true
                    }
                }
            });
        };

        const collider = addBox(scale.x * 600, 150, scale.x * 300, 100, {
            collisionFilter: {
                mask: collissionMask("box_blocked")
            }
        });

        const explode = (body) => {
            if (body.isStatic) {
                return;
            }

            const ballState = this.state.balls[body.label];
            if (ballState === undefined) {
                return;
            }

            if (!ballState.boxed) {
                return;
            }

            const forceMagnitude = 0.01 * body.mass;

            Body.applyForce(body, body.position, {
                x: (forceMagnitude + Common.random() * forceMagnitude) * Common.choose([1, -1]),
                y: -forceMagnitude + Common.random() * -forceMagnitude
            });
        }

        var counter = 0;
        Events.on(engine, 'afterUpdate', function(event) {
            counter += 1;
            // every 0.5 sec
            if (counter >= 60 * 0.5) {
                // create some random forces
                const bodies = Composite.allBodies(engine.world);

                for (var i = 0; i < bodies.length; i++) {
                    explode(bodies[i]);
                }

                // reset counter
                counter = 0;
            }
        });

        Events.on(engine, 'collisionStart', function(event) {
            var pairs = event.pairs;

            for (var i = 0, j = pairs.length; i != j; ++i) {
                var pair = pairs[i];

                if (pair.bodyA === collider) {
                    enterBox("collider", pair.bodyB);
                } else if (pair.bodyB === collider) {
                    enterBox("collider", pair.bodyA);
                }
            }
        });

        Events.on(engine, 'collisionEnd', function(event) {
            var pairs = event.pairs;

            for (var i = 0, j = pairs.length; i != j; ++i) {
                var pair = pairs[i];

                if (pair.bodyA === collider) {
                    pair.bodyB.render.fillStyle = ballColors['green'];
                } else if (pair.bodyB === collider) {
                    pair.bodyA.render.fillStyle = ballColors['green'];
                }
            }
        });

        // add mouse control
        var mouse = Matter.Mouse.create(render.canvas);
        var mouseConstraint = Matter.MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });
        Matter.World.add(engine.world, mouseConstraint);

        Matter.Engine.run(engine);

        Matter.Render.run(render);

        this.setState({
            render: render
        });
    }

    addBall(ball) {
        const body = Bodies.circle(210, 100, 20, {
            frictionAir: 0,
            friction: 0.0001,
            restitution: 0.8,
            density: 0.000001,
            label: ball.id,
            render: {
                fillStyle: ballColors[ball.color],
                lineWidth: 1
            }
        });

        this.setState({
            balls: {
                ...this.state.balls,
                [ball.id]: {
                    ball: ball.id,
                    body: body
                }
            }
        });

        Matter.World.add(this.state.render.engine.world, body);
    }

    componentDidUpdate() {
        _.each(this.props.balls, (ball) => {
            if (this.state.balls[ball.id] === undefined) {
                this.addBall(ball);
            } else {
                const ballState = this.state.balls[ball.id];
                const body = ballState.body;

                body.collisionFilter.category = collisionCategory(ball, ballState);

                if (ball.stage === "entrypoint_start") {
                    body.render.fillStyle = '#333333';
                }
            }
        });
    }

    render() {
        return <div ref="scene" />;
    }
}

export default Scene;
