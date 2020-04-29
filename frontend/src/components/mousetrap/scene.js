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
                ...opts
            };
            const boxes = {
                sensor: Bodies.rectangle(x, y, width - 50, height - 50, {
                    isSensor: true,
                    isStatic: true,
                    render: {
                        lineWidth: 1
                    }
                }),
                top: Bodies.rectangle(x, y - (height / 2), width, 1, options),
                bottom: Bodies.rectangle(x, y + (height / 2), width, 1, options),
                left: Bodies.rectangle(x - (width / 2), y, 1, height, options),
                right: Bodies.rectangle(x + (width / 2), y, 1, height, options)
            };

            var boxBody = Body.create({
                parts: _.values(boxes)
            });

            const constraint = Constraint.create({
                pointA: { x: x, y: y },
                bodyB: boxBody,
                // pointB: { x: -25, y: 0 },
                length: 0,
                stiffness: 0.3
            });

            World.add(world, [boxBody, constraint]);

            return {
                body: boxBody,
                width,
                height,
                ...boxes
            };
        }

        const addRope = (x, y, length) => {
            const num = length;
            var rope = Composites.stack(100, 50, num, 1, 10, 10, (x, y) => {
                return Bodies.rectangle(x, y, 50, 20, {
                    // isStatic: true,
                });
            });

            Composites.chain(rope, 0.5, 0, -0.5, 0, {
                stiffness: 1, length: 0, render: { type: 'line' }
            });

            const constraint = Constraint.create({
                pointA: { x: x, y: y },
                bodyB: rope.bodies[0],
                pointB: { x: -25, y: 0 },
                length: 0,
                stiffness: 1
            });

            World.add(world, [rope, constraint]);

            return rope;
        }

        const addPipe = (x, y, length, width) => {
            const ropeA = addRope(x + width, y, length - 3);
            const ropeB = addRope(x, y, length);

            return {
                top: {
                    start: ropeA.bodies[0],
                    end: ropeA.bodies[ropeA.bodies.length - 1],
                },
                bottom: {
                    start: ropeB.bodies[0],
                    end: ropeB.bodies[ropeB.bodies.length - 1]
                },
                offset: {
                    x: 25,
                    y: 0
                }
            }
        };

        const attachRope = (rope, box, boxPoint) => {
            const constraint = Constraint.create({
                length: 0,
                bodyA: rope.end,
                pointA: {
                    x: 25,
                    y: 0
                },
                bodyB: box.body,
                pointB: boxPoint
            });
            World.add(world, constraint);
        };

        const attachPipe = (pipe, box) => {
            attachRope(pipe.top, box, {
                x: -1 * (box.width / 2),
                y: -1 * (box.height / 2)
            });
            attachRope(pipe.bottom, box, {
                x: -1 * (box.width / 2),
                y: 1 * (box.height / 2)
            });
        };

        const pipes = [addPipe(100, 50, 8, 100)];

        // Add the first box
        const entrypointBox = addBox(scale.x * 600, 150, scale.x * 300, 100, {
            collisionFilter: {
                mask: ballStages["default"] | ballStages["box_blocked"] | ballStages["box_exit"]
            }
        });

        attachPipe(pipes[0], entrypointBox);

        // var ropeA = Composites.stack(100, 50, 8, 1, 10, 10, function(x, y) {
        //     return Bodies.rectangle(x, y, 50, 20, { collisionFilter: { group: group } });
        // });

        // World.add(engine.world, [
        //     Bodies.rectangle(scale.x * 200, 150, scale.x * 500, 20, { isStatic: true, angle: Math.PI * 0.06 }),
        //     Bodies.rectangle(scale.x * 600, 350, scale.x * 500, 20, { isStatic: true, angle: -Math.PI * 0.06 }),
        //     Bodies.rectangle(scale.x * 200, 480, scale.x * 500, 20, { isStatic: true, angle: Math.PI * 0.06 }),
        // ]);

        // const boxDoor = (isBoxed) => (box_name, body) => {
        //     console.log("enter/exit bot", isBoxed, body);
        //     const ballState = this.state.balls[body.label];
        //     this.setState(update(this.state, {
        //         balls: {
        //             [ballState.ball]: {
        //                 boxed: {$set: isBoxed}
        //             }
        //         }
        //     }));
        // };
        // const enterBox = boxDoor(true);
        // const exitBox = boxDoor(false);



        // entrypointBox.bottom.collisionFilter.mask = ballStages["default"] | ballStages["box_blocked"];

        // Events.on(engine, 'collisionStart', function(event) {
        //     _.each(event.pairs, (pair) => {
        //         if (pair.bodyA === entrypointBox.sensor) {
        //             enterBox("collider", pair.bodyB);
        //         } else if (pair.bodyB === entrypointBox.sensor) {
        //             enterBox("collider", pair.bodyA);
        //         }
        //     });
        // });

        // Events.on(engine, 'collisionEnd', function(event) {
        //     _.each(event.pairs, (pair) => {
        //         if (pair.bodyA === entrypointBox.sensor) {
        //             exitBox("collider", pair.bodyB);
        //         } else if (pair.bodyB === entrypointBox.sensor) {
        //             exitBox("collider", pair.bodyA);
        //         }
        //     });
        // });

        // const explode = (body) => {
        //     const ballState = this.state.balls[body.label];
        //     if (body.isStatic || ballState === undefined || !ballState.boxed) {
        //         return;
        //     }

        //     const forceMagnitude = 0.01 * body.mass;

        //     Body.applyForce(body, body.position, {
        //         x: (forceMagnitude + Common.random() * forceMagnitude) * Common.choose([1, -1]),
        //         y: -forceMagnitude + Common.random() * -forceMagnitude
        //     });
        // }

        // var counter = 0;
        // Events.on(engine, 'afterUpdate', function(event) {
        //     counter += 1;
        //     // every 0.5 sec
        //     if (counter >= 60 * 0.5) {
        //         // create some random forces
        //         const bodies = Composite.allBodies(engine.world);

        //         for (var i = 0; i < bodies.length; i++) {
        //             explode(bodies[i]);
        //         }

        //         // reset counter
        //         counter = 0;
        //     }
        // });

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
