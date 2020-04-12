import PropTypes from "prop-types";
import React from "react";
import Matter, { Bodies, Composites, World } from "matter-js";
import _ from 'lodash'

const ballColors = {
    'green': '#C7F464',
    'red': '#C44D58',
};
export const BALL_COLORS = _.keys(ballColors);

const collisionCategories = {
    default: "0x0001",
    green: "0x0002",
    red: "0x0004"
};

// // define our categories (as bit fields, there are up to 32 available)
// var defaultCategory = 0x0001,
//     redCategory = 0x0002,
//     greenCategory = 0x0004,
//     blueCategory = 0x0008;

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
                // category: collisionCategories["green"]
                mask: collisionCategories["green"]
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

    componentDidUpdate() {
        console.log("updated", this.props.balls);

        _.each(this.props.balls, (ball) => {
            if (this.state.balls[ball.id] === undefined) {
                const body = Bodies.circle(210, 100, 30, {
                    friction: 0.00001,
                    restitution: 0.5,
                    density: 0.001,
                    render: {
                        fillStyle: ballColors[ball.color],
                        lineWidth: 1
                    },
                    collisionFilter: {
                        category: collisionCategories[ball.color]
                        // mask: collisionCategories["default"] | collisionCategories[ball.color]
                    }
                });
                console.log("add body", body);
                this.state.balls[ball.id] = {
                    ball: ball,
                    body: body
                };

                Matter.World.add(this.state.render.engine.world, body);
            }
        });
    }

    render() {
        return <div ref="scene" />;
    }
}

export default Scene;
