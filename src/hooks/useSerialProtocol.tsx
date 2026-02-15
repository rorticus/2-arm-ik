/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export type SerialContextType = {
  port: SerialPort | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setServoAngles?: (theta0: number, theta1: number) => Promise<void>;
};

const SerialContext = createContext<SerialContextType | null>(null);

function calculateChecksum(data: Uint8Array): number {
  let checksum = 0;
  for (const byte of data) {
    checksum ^= byte;
  }
  return checksum;
}

export function SerialProvider({ children }: { children: React.ReactNode }) {
  const [port, setPort] = useState<SerialPort | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );

  const startReading = useCallback(async (serialPort: SerialPort) => {
    if (!serialPort.readable) return;
    const reader = serialPort.readable.getReader();
    readerRef.current = reader;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        console.log("Serial data:", new TextDecoder().decode(value));
      }
    } catch (error) {
      console.error("Error reading serial port:", error);
    } finally {
      reader.releaseLock();
      readerRef.current = null;
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      if ("serial" in navigator) {
        const newPort = await navigator.serial.requestPort();
        await newPort.open({ baudRate: 9600 });
        setPort(newPort);
        setIsConnected(true);
        startReading(newPort);

        newPort.addEventListener("disconnect", () => {
          setPort(null);
          setIsConnected(false);
        });
      }
    } catch (error) {
      console.error("Failed to connect to serial port:", error);
    }
  }, [startReading]);

  const disconnect = useCallback(async () => {
    if (port) {
      readerRef.current?.cancel();
      await port.close();
      setPort(null);
      setIsConnected(false);
    }
  }, [port]);

  const setServoAngles = useCallback(
    async (theta0: number, theta1: number) => {
      if (port && port.writable) {
        const writer = port.writable.getWriter();
        const command = new Uint8Array([
          0x01, // set angles command
          Number(theta0), // first angle
          Number(theta1 - 90), // second angle
          0x00, // empty
          0x00, // checksum
        ]);
        command[4] = calculateChecksum(command);
        console.log("Writing", command);
        await writer.write(command);
        writer.releaseLock();
      }
    },
    [port],
  );

  return (
    <SerialContext.Provider
      value={{ port, isConnected, connect, disconnect, setServoAngles }}
    >
      {children}
    </SerialContext.Provider>
  );
}

export function useSerialProtocol() {
  const context = useContext(SerialContext);
  if (!context) {
    throw new Error("useSerialProtocol must be used within a SerialProvider");
  }

  return context;
}
