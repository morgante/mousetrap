import PropTypes from "prop-types";
import React from "react";
import Matter, { Bodies } from "matter-js";

class Scene extends React.Component {
    render () {
        return (
            Scene
        )
    }

    componentDidMount() {
        // var Engine = Matter.Engine,
        //     Render = Matter.Render,
        //     World = Matter.World,
        //     Bodies = Matter.Bodies,
        //     Mouse = Matter.Mouse,
        //     MouseConstraint = Matter.MouseConstraint;
        
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

        var ballA = Bodies.circle(210, 100, 30, { restitution: 0.5 });
        var ballB = Bodies.circle(110, 50, 30, { restitution: 0.5 });

        Matter.World.add(engine.world, [
          // walls
          Bodies.rectangle(200, 0, 600, 50, { isStatic: true }),
          Bodies.rectangle(200, 600, 600, 50, { isStatic: true }),
          Bodies.rectangle(260, 300, 50, 600, { isStatic: true }),
          Bodies.rectangle(0, 300, 50, 600, { isStatic: true })
        ]);
    
        Matter.World.add(engine.world, [ballA, ballB]);

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

        Matter.Events.on(mouseConstraint, "mousedown", function(event) {
          Matter.World.add(engine.world, Bodies.circle(150, 50, 30, { restitution: 0.7 }));
        });
    
        Matter.Engine.run(engine);
    
        Matter.Render.run(render);
    }

    render() {
        return <div ref="scene" />;
    }
}

export default Scene;
