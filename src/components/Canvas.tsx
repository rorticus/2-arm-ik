import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";

type Camera = {
  x: number; // world coordinate at center of viewport
  y: number;
  zoom: number; // pixels per world unit
};

type CanvasProps = {
  l1: number;
  l2: number;
  theta0: number;
  theta1: number;
  onClick?: (x: number, y: number) => void;
};

export default function Canvas({
  l1,
  l2,
  theta0,
  theta1,
  onClick,
}: CanvasProps) {
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    camX: number;
    camY: number;
  } | null>(null);

  // World → screen coordinate conversion
  const worldToScreen = useCallback(
    (wx: number, wy: number, width: number, height: number) => ({
      x: (wx - camera.x) * camera.zoom + width / 2,
      y: height / 2 - (wy - camera.y) * camera.zoom,
    }),
    [camera],
  );

  // Screen → world coordinate conversion
  const screenToWorld = useCallback(
    (sx: number, sy: number, width: number, height: number) => ({
      x: (sx - width / 2) / camera.zoom + camera.x,
      y: (height / 2 - sy) / camera.zoom + camera.y,
    }),
    [camera],
  );

  // Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);

    const toScreen = (wx: number, wy: number) =>
      worldToScreen(wx, wy, width, height);

    // Grid
    const gridSpacing = 50;
    const topLeft = screenToWorld(0, 0, width, height);
    const bottomRight = screenToWorld(width, height, width, height);
    const startX = Math.floor(topLeft.x / gridSpacing) * gridSpacing;
    const endX = Math.ceil(bottomRight.x / gridSpacing) * gridSpacing;
    const startY = Math.floor(bottomRight.y / gridSpacing) * gridSpacing;
    const endY = Math.ceil(topLeft.y / gridSpacing) * gridSpacing;

    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1;
    for (let wx = startX; wx <= endX; wx += gridSpacing) {
      const s = toScreen(wx, 0);
      ctx.beginPath();
      ctx.moveTo(s.x, 0);
      ctx.lineTo(s.x, height);
      ctx.stroke();
    }
    for (let wy = startY; wy <= endY; wy += gridSpacing) {
      const s = toScreen(0, wy);
      ctx.beginPath();
      ctx.moveTo(0, s.y);
      ctx.lineTo(width, s.y);
      ctx.stroke();
    }

    // Axes
    const originScreen = toScreen(0, 0);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, originScreen.y);
    ctx.lineTo(width, originScreen.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(originScreen.x, 0);
    ctx.lineTo(originScreen.x, height);
    ctx.stroke();

    // Origin dot
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(originScreen.x, originScreen.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // reachability circle
    const reach = l1 + l2;
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const rScreen = reach * camera.zoom;
    ctx.arc(originScreen.x, originScreen.y, rScreen, 0, Math.PI * 2);
    ctx.stroke();

    // largest positive rectangle inscribed in reachability circle
    const rectSide = reach / Math.SQRT2;
    const rectOrigin = toScreen(0, 0);
    const rectCorner = toScreen(rectSide, rectSide);
    ctx.strokeStyle = "rgba(0, 128, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(
      rectOrigin.x,
      rectCorner.y,
      rectCorner.x - rectOrigin.x,
      rectOrigin.y - rectCorner.y,
    );
    ctx.setLineDash([]);

    // Arms
    const theta0Rad = (theta0 * Math.PI) / 180;
    const theta1Rad = (theta1 * Math.PI) / 180;

    const joint = { x: l1 * Math.cos(theta0Rad), y: l1 * Math.sin(theta0Rad) };
    const end = {
      x: joint.x + l2 * Math.cos(theta0Rad + theta1Rad),
      y: joint.y + l2 * Math.sin(theta0Rad + theta1Rad),
    };

    const os = toScreen(0, 0);
    const js = toScreen(joint.x, joint.y);
    const es = toScreen(end.x, end.y);

    ctx.strokeStyle = "blue";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(os.x, os.y);
    ctx.lineTo(js.x, js.y);
    ctx.stroke();

    ctx.strokeStyle = "green";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(js.x, js.y);
    ctx.lineTo(es.x, es.y);
    ctx.stroke();
  }, [
    camera,
    canvasSize,
    l1,
    l2,
    theta0,
    theta1,
    worldToScreen,
    screenToWorld,
  ]);

  // Resize observer
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      setCanvasSize({ width: canvas.width, height: canvas.height });
    });
    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, []);

  // Drag-to-pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        camX: camera.x,
        camY: camera.y,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = (e.clientX - dragRef.current.startX) / camera.zoom;
      const dy = (e.clientY - dragRef.current.startY) / camera.zoom;
      setCamera((c) => ({
        ...c,
        x: dragRef.current!.camX - dx,
        y: dragRef.current!.camY + dy,
      }));
    };

    const onMouseUp = () => {
      dragRef.current = null;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [camera.x, camera.y, camera.zoom]);

  // Scroll-to-zoom (zoom toward cursor)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      setCamera((c) => {
        const worldBefore = {
          x: (sx - canvas.width / 2) / c.zoom + c.x,
          y: (canvas.height / 2 - sy) / c.zoom + c.y,
        };
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.05, Math.min(100, c.zoom * factor));
        // Adjust camera so the world point under cursor stays in place
        const newX = worldBefore.x - (sx - canvas.width / 2) / newZoom;
        const newY = worldBefore.y - (canvas.height / 2 - sy) / newZoom;
        return { x: newX, y: newY, zoom: newZoom };
      });
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <canvas
      className="w-full h-full"
      ref={canvasRef}
      onClick={(e) => {
        if (!onClick || dragRef.current) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const world = screenToWorld(sx, sy, rect.width, rect.height);
        onClick(world.x, world.y);
      }}
    />
  );
}
