// src/utils/physics.ts
import Matter from "matter-js";

export function createEngine(canvas: HTMLCanvasElement) {
  const engine = Matter.Engine.create();
  const render = Matter.Render.create({
    canvas,
    engine,
    options: { wireframes: false, background: "transparent" },
  });
  Matter.Render.run(render);
  Matter.Runner.run(Matter.Runner.create(), engine);
  return engine;
}
