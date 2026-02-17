import { useEffect, useRef, useState } from 'react';
import './GamerAvatar.css';

const GamerCanvas = ({ mousePos = { x: 0, y: 0 }, isBlinking = false }) => {
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        // In React, we usually use process.env.PUBLIC_URL or relative to the component
        // Assuming the file is in src, it will be moved during build.
        // However, for local dev, we can try importing it.
        img.src = require('../rakan_8bit_computer.png');
        img.onload = () => {
            imageRef.current = img;
            setLoaded(true);
        };
    }, []);

    useEffect(() => {
        if (loaded && canvasRef.current && imageRef.current) {
            const canvas = canvasRef.current;
            canvas.width = imageRef.current.naturalWidth || 701;
            canvas.height = imageRef.current.naturalHeight || 989;
            draw();
        }
    }, [loaded]);

    useEffect(() => {
        if (loaded) {
            draw();
        }
    }, [mousePos, isBlinking]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        // Ensure pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'low';

        // 1. Draw Original Art
        ctx.drawImage(imageRef.current, 0, 0, width, height);

        // 2. Animate Eyes
        const skinColor = '#d3b99a';
        const eyeWhite = '#ffffff';
        const pupilColor = '#231712';

        // Eye Box Coordinates - Shifted significantly to cover background artifacts
        const leftEye = { x: 165, y: 280, w: 170, h: 145 };
        const rightEye = { x: 400, y: 280, w: 185, h: 145 };

        const drawEye = (box) => {
            const bx = Math.round(box.x);
            const by = Math.round(box.y);
            const bw = Math.round(box.w);
            const bh = Math.round(box.h);

            // First, "erase" the eye area by covering it with skin color
            ctx.fillStyle = skinColor;
            ctx.fillRect(bx, by, bw, bh);

            if (isBlinking) {
                // Draw only the closed eye line
                ctx.fillStyle = pupilColor;
                const lineH = Math.max(8, Math.round(bh * 0.1));
                ctx.fillRect(
                    bx + Math.round(bw * 0.1),
                    by + Math.round(bh / 2) - Math.round(lineH / 2),
                    Math.round(bw * 0.8),
                    lineH
                );
            } else {
                // Draw White part
                // We add a tiny 0.5px "bleed" or just ensure integer overlap
                ctx.fillStyle = eyeWhite;
                const border = 6;
                ctx.fillRect(
                    bx + border,
                    by + border,
                    bw - (border * 2),
                    bh - (border * 2)
                );

                // Pupil (moving)
                const innerW = bw - (border * 2);
                const innerH = bh - (border * 2);
                const pupW = Math.round(innerW * 0.45);
                const pupH = Math.round(innerH * 0.45);

                // Calculate move centered offset
                const moveX = Math.round(mousePos.x * (innerW - pupW) * 0.5);
                const moveY = Math.round(mousePos.y * (innerH - pupH) * 0.5);

                const pupX = bx + border + Math.round((innerW - pupW) / 2) + moveX;
                const pupY = by + border + Math.round((innerH - pupH) / 2) + moveY;

                ctx.fillStyle = pupilColor;
                ctx.fillRect(pupX, pupY, pupW, pupH);
            }
        };

        drawEye(leftEye);
        drawEye(rightEye);
    };

    return (
        <div className="canvas-avatar-container">
            <canvas
                ref={canvasRef}
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                    aspectRatio: '701 / 989',
                    display: 'block',
                    imageRendering: 'pixelated'
                }}
            />
        </div>
    );
};

export default GamerCanvas;
