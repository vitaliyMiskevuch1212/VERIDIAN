import React, { useRef, useEffect, useState } from 'react';

export default function DroneFeed({ lat = 0, lng = 0, region = "TARGET ZONE" }) {
  const canvasRef = useRef(null);
  const [stamp, setStamp] = useState(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameId;

    const width = canvas.width;
    const height = canvas.height;

    // FLIR color palette (Thermal White Hot)
    const drawNoise = () => {
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Base thermal noise (grayscales from 20 to 180)
        let val = 20 + Math.random() * 160;