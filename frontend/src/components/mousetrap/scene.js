import PropTypes from "prop-types";
import React from "react";
import Matter, { Body, Bodies, Composite, Events, World, Common, Constraint } from "matter-js";
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

        world.gravity.y = 0;

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
                // isStatic: true,
                render: {
                    strokeStyle: ballColors['red'],
                    lineWidth: 1
                },
                ...opts
            };
            const boxes = {
                sensor: Bodies.rectangle(x, y, width - 50, height - 50, {
                    isSensor: true,
                    // isStatic: true,
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

            World.add(world, boxBody);

            return {
                body: boxBody,
                width,
                height,
                ...boxes
            };
        }

        // Add the first box
        const entrypointBox = addBox(scale.x * 600, 150, scale.x * 300, 100, {
            collisionFilter: {
                mask: ballStages["default"] | ballStages["box_blocked"] | ballStages["box_exit"]
            }
        });

        const boxTwo = addBox(scale.x * 300, 150, scale.x * 300, 100, {
            // collisionFilter: {
            //     mask: ballStages["default"] | ballStages["box_blocked"] | ballStages["box_exit"]
            // }
        });

        // const pipe = Bodies.rectangle(scale.x * 200, 150, scale.x * 500, 20, {
        //     isStatic: false,
        //     angle: Math.PI * 0.06
        // });
        // World.add(world, pipe);

        console.log("info", entrypointBox);

        var constraint = Constraint.create({
            bodyA: boxTwo.body,
            pointA: {
                x: 1 * (boxTwo.width / 2),
                y: 0
            },
            bodyB: entrypointBox.body,
            pointB: {
                x: -1 * (entrypointBox.width / 2),
                y: 0
            }
        });
        World.add(world, constraint);

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
