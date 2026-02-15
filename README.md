# 2-Arm IK

A 2-DOF robotic arm inverse kinematics simulator with real-time hardware control. Click or drag on a canvas to set a target position, and the app computes the joint angles needed to reach it — optionally sending them to a physical servo-driven arm over serial.

## Web App

Built with React, TypeScript, Vite, and Tailwind CSS.

- Interactive canvas with pan and zoom
- Click to set a target position, or toggle **Drag Mode: IK** to continuously update angles while dragging
- Visualizes both arm segments, the reachability circle, and an inscribed working rectangle
- Target positions beyond the arm's reach are automatically clamped
- Configurable arm segment lengths (L1, L2) and direct angle inputs (θ0, θ1)
- Connects to hardware over Web Serial API (9600 baud) to send joint angles in real time

### Getting Started

```sh
npm install
npm run dev
```

## Firmware

PlatformIO project targeting the Arduino Uno R4 Minima. Receives servo angle commands over serial and drives two servos.

- 5-byte binary packet protocol: command byte, 3 data bytes, XOR checksum
- Circular buffer for serial input
- Servos on pins 3 and 5

### Building

```sh
cd firmware/2-arm-ik
pio run -t upload
```
