import PropTypes from "prop-types";
import React from "react";
import Matter, { Bodies, Composites, World } from "matter-js";
import _ from "underscore";

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
                    density: 0.001 
                });
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
