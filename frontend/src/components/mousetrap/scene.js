import PropTypes from "prop-types";
import React from "react";
import Matter, { Bodies, Composites, World } from "matter-js";
import _ from 'lodash'

const ballColors = {
    'green': '#C7F464',
    'red': '#C44D58',
};
export const BALL_COLORS = _.keys(ballColors);

const ballStages = {
    default: 0x0001,
    entrypoint_wait: 0x0002,
    entrypoint_start: 0x0004,
};
function collissionMask(stage) {
    return ballStages["default"] | ballStages[stage];
}
function collisionCategory(stage) {
    return ballStages[stage];
}

class Scene extends React.Component {
    state = {
        balls: {}
    }

    componentDidMount() {
        var engine = Matter.Engine.create({
            // positionIterations: 20
        });

        var render = Matter.Render.create({
            element: this.refs.scene,
            engine: engine,
            options: {
              width: 600,
              height: 600,
              wireframes: false
            }
        });

        World.add(engine.world, [
            Bodies.rectangle(200, 150, 400, 20, { isStatic: true, angle: Math.PI * 0.06 }),
            Bodies.rectangle(500, 350, 700, 20, { isStatic: true, angle: -Math.PI * 0.06 }),
            Bodies.rectangle(340, 580, 700, 20, { isStatic: true, angle: Math.PI * 0.04 })
        ]);

        // Add a filter/obstacle
        const blocker = Bodies.rectangle(400, 100, 300, 50, {
            isStatic: true,
            angle: Math.PI * -0.3,
            collisionFilter: {
                mask: collissionMask("entrypoint_wait")
            }
        });

        World.add(engine.world, blocker);
    
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
        const body = Bodies.circle(210, 100, 30, {
            friction: 0.00001,
            restitution: 0.5,
            density: 0.001,
            render: {
                fillStyle: ballColors[ball.color],
                lineWidth: 1
            },
            collisionFilter: {
                category: collisionCategory(ball.stage)
            }
        });

        this.setState({
            balls: {
                ...this.state.balls,
                [ball.id]: {
                    ball: ball,
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
                const body = this.state.balls[ball.id].body;

                if (ball.stage === "entrypoint_start") {
                    body.render.fillStyle = '#333333';
                    body.collisionFilter.category = collisionCategory(ball.stage);
                    // Matter.Body.set(body, {
                    //     // collisionFilter: {
                    //     //     // mask: ballCollisionFilter(ball)
                    //     // },
                    //     render: {
                    //         fillStyle: '#D44D58'
                    //     }
                    // });
                }
                console.log("update ball", ball, body, ballStages[ball.stage], ballStages["default"] | ballStages[ball.stage]);
            }
            // this.state.balls[ball.id]

            // Matter.Body.set()

            // this.state
        });
    }

    render() {
        return <div ref="scene" />;
    }
}

export default Scene;
