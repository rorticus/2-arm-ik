import { useCallback, useEffect, useState } from "react";
import "./App.css";
import NumberInput from "./components/NumberInput";
import Canvas from "./components/Canvas";
import { useSerialProtocol } from "./hooks/useSerialProtocol";

function App() {
  const [l1, setL1] = useState(100);
  const [l2, setL2] = useState(100);
  const [theta0, setTheta0] = useState(80);
  const [theta1, setTheta1] = useState(-45);

  const { isConnected, connect, setServoAngles } = useSerialProtocol();

  const calculateThetas = useCallback(
    (x: number, y: number) => {
      const d = Math.sqrt(x * x + y * y);
      const a = Math.atan2(y, x);
      const b = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
      const c = Math.acos((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2));
      setTheta0(((a + b) * 180) / Math.PI);
      setTheta1(((c - Math.PI) * 180) / Math.PI);
    },
    [l1, l2],
  );

  useEffect(() => {
    setServoAngles?.(theta0, theta1);
  }, [theta0, theta1, setServoAngles]); // Update servo angles on change

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-gray-200 flex items-center p-4 gap-8">
        <h1 className="text-2xl font-bold">2 Arm IK</h1>
        <NumberInput
          label={
            <span>
              L<sub>1</sub>
            </span>
          }
          value={l1}
          onChange={setL1}
        />
        <NumberInput
          label={
            <span>
              L<sub>2</sub>
            </span>
          }
          value={l2}
          onChange={setL2}
        />

        <NumberInput
          label={
            <span>
              &theta;<sub>0</sub>
            </span>
          }
          value={theta0}
          onChange={setTheta0}
        />
        <NumberInput
          label={
            <span>
              &theta;<sub>1</sub>
            </span>
          }
          value={theta1}
          onChange={setTheta1}
        />
        <button
          className="ml-auto px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          disabled={isConnected}
          onClick={() => {
            connect();
          }}
        >
          {isConnected ? "Connected" : "Connect Serial"}
        </button>
      </div>
      <div className="flex-1 bg-amber-200">
        <Canvas
          l1={l1}
          l2={l2}
          theta0={theta0}
          theta1={theta1}
          onClick={(x, y) => {
            calculateThetas(x, y);
          }}
        />
      </div>
    </div>
  );
}

export default App;
