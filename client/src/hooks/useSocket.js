import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * useSocket — Real-time WebSocket connection to VERIDIAN server
 * Provides live connection status, server heartbeat, and push event listeners
 */
export default function useSocket() {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [serverClients, setServerClients] = useState(0);
  const [serverUptime, setServerUptime] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[WS] Connected to VERIDIAN server');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[WS] Connection error:', err.message);
      setIsConnected(false);
    });

    socket.on('server:status', (data) => {
      setServerClients(data.clients || 0);
      setServerUptime(data.uptime || 0);
    });

    socket.on('server:clients', (count) => {
      setServerClients(count);
    });

    socket.on('server:heartbeat', (data) => {
      setLastHeartbeat(data);
      setServerUptime(data.uptime || 0);
      setServerClients(data.clients || 0);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Subscribe to real-time events
  const onEvent = useCallback((eventName, callback) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    
    socket.on(eventName, callback);
    listenersRef.current.set(eventName, callback);

    return () => {
      socket.off(eventName, callback);
      listenersRef.current.delete(eventName);
    };
  }, []);

  // Request data refresh from server
  const requestRefresh = useCallback((dataType) => {
    socketRef.current?.emit('client:requestRefresh', dataType);
  }, []);

  return {
    isConnected,
    serverClients,
    serverUptime,
    lastHeartbeat,
    onEvent,
    requestRefresh,
    socket: socketRef,
  };
}
