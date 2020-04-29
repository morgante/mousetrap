import PropTypes from "prop-types";
import React from "react";
import Matter, { Body, Bodies, Composite, Composites, Events, World, Common, Constraint } from "matter-js";
import _ from 'lodash';
import update from 'immutability-helper';

const ballColors = {
    'green': '#C7F464',
    'red': '#C44D58',
};
export const BALL_COLORS = _.keys(ballColors);

const ballStages = {
    default: 0x0001,
    box_blocked: 0x0002,
    box_enter: 0x0004,
    box_exit: 0x0008
};

function collissionMask(stage) {
    return ballStages["default"] | ballStages[stage];
}

function collisionCategory(ball, ballState) {
    switch (ball.stage) {
        case "entrypoint_wait":
            return ballStages["box_blocked"];
        case "entrypoint_start":
            if (ballState.boxed) {
                return ballStages["box_blocked"];
            } else {
                return ballStages["box_enter"];
            }
        case "entrypoint_done":
            if (ballState.boxed) {
                return ballStages["box_exit"];
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

        // world.gravity.y = 0;

        const scale = {
            x: 1,
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

        // Add a sensor
        const addBox = (x, y, width, height, opts) => {
            const options = {
                isStatic: true,
                render: {
                    strokeStyle: ballColors['red'],
                    lineWidth: 1
                },
            };
            const dimensions = {
                top: [0, height / -2, width, 1],
                bottom: [0, height / 2, width, 1],
                left: [width / -2, 0, 1, height],
                right: [width / 2, 0, 1, height]
            }
            const boxes = _.mapValues(dimensions, (coordinates) => {
                return Bodies.rectangle(x + coordinates[0], y + coordinates[1], coordinates[2], coordinates[3], {
                    ...options
                })
            });
            // boxes.sensor = Bodies.rectangle(x, y, width - 50, height - 50, {
            //     isSensor: true,
            //     isStatic: true,
            //     render: {
            //         lineWidth: 1
            //     }
            // });

            // add composite box
            var boxBody = Body.create({
                parts: _.values(boxes),
                isStatic: true,
                collisionFilter: {
                    group: -10,
                    mask: ballStages["default"]
                }
            });
            World.add(world, boxBody);

            const addEdge = (coordinates) => {
                const edge = Bodies.rectangle(x + coordinates[0], y + coordinates[1], coordinates[2], coordinates[3], {
                    ...options,
                    isStatic: true,
                    collisionFilter: {
                        group: -10
                    },
                    render: {
                        strokeStyle: ballColors['red'],
                        lineWidth: 10
                    }
                });
                World.add(world, edge);

                World.add(world, [
                    Constraint.create({
                        length: 0,
                        stiffness: 1,
                        bodyA: boxBody,
                        pointA: { x: coordinates[0] + coordinates[2] / -2, y: coordinates[1] + coordinates[3] / -2 },
                        bodyB: edge,
                        pointB: { x: coordinates[2] / 2, y: coordinates[3] / -2 }
                    }),
                    Constraint.create({
                        length: 0,
                        stiffness: 1,
                        bodyA: boxBody,
                        pointA: { x: coordinates[0] + coordinates[2] / 2, y: coordinates[1] + coordinates[3] / 2 },
                        bodyB: edge,
                        pointB: { x: coordinates[2] / -2, y: coordinates[3] / 2 }
                    }),
                ]);
            };
            _.each(opts.edges, (edge) => {
                addEdge(dimensions[edge]);
            });

            const constraints = [
                // // Attach sensor to box
                // Constraint.create({
                //     bodyA: boxes.top,
                //     bodyB: boxes.sensor,
                //     length: 0,
                //     stiffness: 1
                // }),
                // fix box in place
                Constraint.create({
                    pointA: { x: x, y: y },
                    bodyB: boxBody,
                    pointB: { x: 0, y: 0 },
                    length: 10,
                    stiffness: 0.3
                })
            ];
            World.add(world, constraints);

            // World.add(world, [boxBody, constraint]);

            return {
                body: boxBody,
                // left:
                width,
                height,
                ...boxes
            };
        }

        const addRope = (length) => {
            const num = length;
            var rope = Composites.stack(100, 50, num, 1, 10, 10, (x, y) => {
                return Bodies.rectangle(x, y, 50, 20, {
                    collisionFilter: {
                        group: -10
                    },
                });
            });

            Composites.chain(rope, 0.5, 0, -0.5, 0, {
                stiffness: 0.3, length: 1, render: { type: 'line' }
            });

            // const constraint = Constraint.create({
            //     pointA: { x: x, y: y },
            //     bodyB: rope.bodies[0],
            //     pointB: { x: -25, y: 0 },
            //     length: 0,
            //     stiffness: 1
            // });

            World.add(world, rope);

            return {
                rope: rope,
                start: rope.bodies[0],
                end: rope.bodies[rope.bodies.length - 1]
            };
        }

        const attachRope = (rope, side, box, vertex) => {
            const points = {
                bottomleft: { x: -1 * (box.width / 2), y: 1 * (box.height / 2)},
                bottomright: { x: 1 * (box.width / 2), y: 1 * (box.height / 2)},
                topleft: { x: -1 * (box.width / 2), y: -1 * (box.height / 2)},
                topright: { x: 1 * (box.width / 2), y: -1 * (box.height / 2)}
            };

            const ropePoints = {
                start: {x: -25, y: 0},
                end: {x: 25, y: 0}
            };

            const boxPoint = points[vertex];

            const constraint = Constraint.create({
                length: 0,
                bodyA: rope[side],
                pointA: ropePoints[side],
                bodyB: box.body,
                pointB: boxPoint
            });
            World.add(world, constraint);
        };

        const connectBoxes = (boxA, vertexA, boxB, vertexB, length) => {
            const rope = addRope(length);

            attachRope(rope, 'start', boxA, vertexA);
            attachRope(rope, 'end', boxB, vertexB);
        }

        // Add the boxes
        const boxes = {
            start: addBox(scale.x * 200, 100, scale.x * 300, 100, {
                edges: ['top', 'left', 'right']
            }),
            entrypoint: addBox(scale.x * 600, 300, scale.x * 300, 100, {
                edges: ['top', 'right']
            }),
            gcs: addBox(scale.x * 200, 500, scale.x * 300, 100, {
                edges: ['top', 'left', 'bottom']
            })
        };

        connectBoxes(boxes.start, 'bottomleft', boxes.entrypoint, 'bottomleft', 9);
        connectBoxes(boxes.start, 'bottomright', boxes.entrypoint, 'topleft', 3);
        connectBoxes(boxes.entrypoint, 'bottomleft', boxes.gcs, 'topright', 3);
        connectBoxes(boxes.entrypoint, 'bottomright', boxes.gcs, 'bottomright', 9);

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
            // frictionAir: 0,
            // friction: 0.0001,
            // restitution: 0.3,
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
