import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const SOCKET_OPTIONS = {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 2000,
  reconnectionDelayMax: 10000,
  timeout: 20000,
};

/**
 * useSocketConnection — Manages raw Socket.IO connection lifecycle.
 * Handles instantiation, reconnection strategy, and connection state.
 */
export default function useSocketConnection() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, SOCKET_OPTIONS);
    socketRef.current = socket;

    const handleConnect = () => {
      console.log('[WS] Connected to VERIDIAN server');
      setIsConnected(true);
    };

    const handleDisconnect = (reason) => {
      console.log('[WS] Disconnected:', reason);
      setIsConnected(false);
    };

    const handleError = (err) => {
      console.warn('[WS] Connection error:', err.message);
      setIsConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socketRef, isConnected };
}