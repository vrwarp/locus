import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
    origin?: { x: number, y: number };
    duration?: number;
}

export const Confetti: React.FC<ConfettiProps> = ({ origin, duration }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full screen
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    const colors = ['#FFD700', '#FF4500', '#32CD32', '#00CED1', '#9370DB'];

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      rotation: number;
      rotationSpeed: number;

      constructor() {
        if (origin) {
            this.x = origin.x;
            this.y = origin.y;
            this.speedX = (Math.random() * 10) - 5;
            this.speedY = (Math.random() * -10) - 2; // Burst upwards
        } else {
            this.x = Math.random() * canvas!.width;
            // Start scattered above the fold but some near the top to be seen immediately
            this.y = Math.random() * canvas!.height - canvas!.height;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 3 + 3;
        }

        this.size = Math.random() * 10 + 5;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 5 - 2.5;
      }

      update() {
        // Gravity effect
        if (origin) {
            this.speedY += 0.2;
        }

        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;

        // Wrap around if it goes off bottom
        if (this.y > canvas!.height && !origin) {
          this.y = -20;
          this.x = Math.random() * canvas!.width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
      }
    }

    const particles: Particle[] = [];
    const particleCount = origin ? 30 : 150;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationId = requestAnimationFrame(animate);
    };

    animate();

    let timeoutId: number;
    if (duration) {
        timeoutId = setTimeout(() => {
             cancelAnimationFrame(animationId);
             ctx.clearRect(0, 0, canvas!.width, canvas!.height);
        }, duration);
    }

    const handleResize = () => {
      setSize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [origin, duration]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  );
};
