import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketOptions {
  namespace?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
}

interface SocketState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    namespace = "/",
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    reconnectionDelayMax = 5000,
    timeout = 20000,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    connecting: autoConnect,
    error: null,
  });

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    // Construct socket URL
    const socketUrl = namespace === "/"
      ? window.location.origin
      : `${window.location.origin}${namespace}`;

    console.log(`[useSocket] Connecting to ${socketUrl}`);

    // Create socket instance
    const socket = io(socketUrl, {
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      reconnectionDelayMax,
      timeout,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on("connect", () => {
      console.log(`[useSocket] Connected to ${namespace}:`, socket.id);
      setState({ connected: true, connecting: false, error: null });
    });

    socket.on("disconnect", (reason) => {
      console.log(`[useSocket] Disconnected from ${namespace}:`, reason);
      setState((prev) => ({ ...prev, connected: false }));
    });

    socket.on("connect_error", (error) => {
      console.error(`[useSocket] Connection error on ${namespace}:`, error);
      setState({ connected: false, connecting: false, error });
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`[useSocket] Reconnected to ${namespace} after ${attemptNumber} attempts`);
      setState({ connected: true, connecting: false, error: null });
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`[useSocket] Reconnection attempt ${attemptNumber} to ${namespace}`);
      setState((prev) => ({ ...prev, connecting: true }));
    });

    socket.on("reconnect_error", (error) => {
      console.error(`[useSocket] Reconnection error on ${namespace}:`, error);
      setState((prev) => ({ ...prev, error }));
    });

    socket.on("reconnect_failed", () => {
      console.error(`[useSocket] Reconnection failed on ${namespace}`);
      setState({
        connected: false,
        connecting: false,
        error: new Error("Reconnection failed"),
      });
    });

    // Cleanup on unmount
    return () => {
      console.log(`[useSocket] Cleaning up connection to ${namespace}`);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    namespace,
    autoConnect,
    reconnection,
    reconnectionAttempts,
    reconnectionDelay,
    reconnectionDelayMax,
    timeout,
  ]);

  // Join a room
  const joinRoom = useCallback((room: string, ...args: unknown[]) => {
    if (!socketRef.current?.connected) {
      console.warn(`[useSocket] Cannot join room ${room}: not connected`);
      return;
    }
    console.log(`[useSocket] Joining room: ${room}`);
    socketRef.current.emit(room, ...args);
  }, []);

  // Leave a room
  const leaveRoom = useCallback((room: string, ...args: unknown[]) => {
    if (!socketRef.current?.connected) {
      console.warn(`[useSocket] Cannot leave room ${room}: not connected`);
      return;
    }
    console.log(`[useSocket] Leaving room: ${room}`);
    socketRef.current.emit(room.replace("join:", "leave:"), ...args);
  }, []);

  // Emit an event
  const emit = useCallback((event: string, ...args: unknown[]) => {
    if (!socketRef.current?.connected) {
      console.warn(`[useSocket] Cannot emit ${event}: not connected`);
      return;
    }
    socketRef.current.emit(event, ...args);
  }, []);

  // Subscribe to an event
  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    if (!socketRef.current) {
      console.warn(`[useSocket] Cannot subscribe to ${event}: socket not initialized`);
      return () => {};
    }
    socketRef.current.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  // Unsubscribe from an event
  const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
    if (!socketRef.current) return;
    socketRef.current.off(event, handler);
  }, []);

  // Manual connect/disconnect
  const connect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      console.log(`[useSocket] Manually connecting to ${namespace}`);
      setState((prev) => ({ ...prev, connecting: true }));
      socketRef.current.connect();
    }
  }, [namespace]);

  const disconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log(`[useSocket] Manually disconnecting from ${namespace}`);
      socketRef.current.disconnect();
    }
  }, [namespace]);

  return {
    socket: socketRef.current,
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    joinRoom,
    leaveRoom,
    emit,
    on,
    off,
    connect,
    disconnect,
  };
}
