import React, { useEffect, useRef } from "react";

export default function WeatherBackground({ condition }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animation;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const rain = Array(80)
      .fill()
      .map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        len: 10 + Math.random() * 20,
        speed: 4 + Math.random() * 4,
      }));

    const snow = Array(60)
      .fill()
      .map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: 1 + Math.random() * 3,
        d: Math.random(),
      }));

    const lightning = [];

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (condition.includes("rain")) {
        ctx.strokeStyle = "rgba(200,200,255,0.6)";
        ctx.lineWidth = 2;
        rain.forEach((r) => {
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x, r.y + r.len);
          ctx.stroke();
          r.y += r.speed;
          if (r.y > canvas.height) {
            r.y = 0;
            r.x = Math.random() * canvas.width;
          }
        });
      }

      if (condition.includes("snow")) {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        snow.forEach((s) => {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
          s.y += s.d + 0.5;
          if (s.y > canvas.height) {
            s.y = 0;
            s.x = Math.random() * canvas.width;
          }
        });
      }

      if (condition.includes("thunder") && Math.random() > 0.985) {
        lightning.push({ time: Date.now() });
      }
      lightning.forEach((l, i) => {
        const alpha = 1 - (Date.now() - l.time) / 150;
        if (alpha <= 0) lightning.splice(i, 1);
        ctx.fillStyle = `rgba(255,255,200,${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animation = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animation);
  }, [condition]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
}
