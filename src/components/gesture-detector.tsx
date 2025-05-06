'use client';

import { useRef, useEffect, type ReactNode } from 'react';

interface GestureDetectorProps {
	children?: ReactNode;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onPan: (deltaX: number, deltaY?: number) => void;
}

export const GestureDetector = ({
	children,
	onZoomIn,
	onZoomOut,
	onPan,
}: GestureDetectorProps) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const initialTouchDistance = useRef<number | null>(null);
	const lastTouchPosition = useRef<{ x: number; y: number } | null>(null);
	const pinchCooldown = useRef<boolean>(false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		// Calculate distance between two touch points
		const getTouchDistance = (touches: TouchList): number => {
			if (touches.length < 2) return 0;

			const dx = touches[0].clientX - touches[1].clientX;
			const dy = touches[0].clientY - touches[1].clientY;
			return Math.sqrt(dx * dx + dy * dy);
		};

		// Get center position of touches
		const getTouchCenter = (touches: TouchList): { x: number; y: number } => {
			if (touches.length < 2) {
				return { x: touches[0].clientX, y: touches[0].clientY };
			}

			return {
				x: (touches[0].clientX + touches[1].clientX) / 2,
				y: (touches[0].clientY + touches[1].clientY) / 2,
			};
		};

		// Touch start handler
		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				initialTouchDistance.current = getTouchDistance(e.touches);
				lastTouchPosition.current = getTouchCenter(e.touches);
			} else if (e.touches.length === 1) {
				lastTouchPosition.current = {
					x: e.touches[0].clientX,
					y: e.touches[0].clientY,
				};
			}
		};

		// Touch move handler
		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 2 && initialTouchDistance.current !== null) {
				// Handle pinch zoom
				const currentDistance = getTouchDistance(e.touches);
				const delta = currentDistance - initialTouchDistance.current;

				// Only trigger zoom after significant pinch and prevent multiple rapid zooms
				if (!pinchCooldown.current) {
					if (delta > 1500) {
						onZoomIn();
						initialTouchDistance.current = currentDistance;
						pinchCooldown.current = true;
						setTimeout(() => {
							pinchCooldown.current = false;
						}, 500);
					} else if (delta < -1500) {
						onZoomOut();
						initialTouchDistance.current = currentDistance;
						pinchCooldown.current = true;
						setTimeout(() => {
							pinchCooldown.current = false;
						}, 500);
					}
				}

				// Handle pan with two fingers
				const currentCenter = getTouchCenter(e.touches);
				if (lastTouchPosition.current) {
					const deltaX = currentCenter.x - lastTouchPosition.current.x;
					const deltaY = currentCenter.y - lastTouchPosition.current.y;
					onPan(deltaX, deltaY);
				}
				lastTouchPosition.current = currentCenter;
			} else if (e.touches.length === 1 && lastTouchPosition.current) {
				// Handle pan with one finger
				const deltaX = e.touches[0].clientX - lastTouchPosition.current.x;
				const deltaY = e.touches[0].clientY - lastTouchPosition.current.y;
				onPan(deltaX, deltaY);
				lastTouchPosition.current = {
					x: e.touches[0].clientX,
					y: e.touches[0].clientY,
				};
			}
		};

		// Touch end handler
		const handleTouchEnd = () => {
			initialTouchDistance.current = null;
			lastTouchPosition.current = null;
		};

		// Wheel handler for desktop zoom
		const handleWheel = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				// Prevent default zoom behavior
				e.preventDefault();

				console.log('handleWheel', e.deltaY);

				if (e.deltaY < -2) {
					onZoomIn();
				} else if (e.deltaY > 2) {
					onZoomOut();
				}
			}
		};

		// event listeners
		container.addEventListener('touchstart', handleTouchStart, {
			passive: false,
		});
		container.addEventListener('touchmove', handleTouchMove, {
			passive: false,
		});
		container.addEventListener('touchend', handleTouchEnd);
		container.addEventListener('wheel', handleWheel, { passive: false });

		return () => {
			container.removeEventListener('touchstart', handleTouchStart);
			container.removeEventListener('touchmove', handleTouchMove);
			container.removeEventListener('touchend', handleTouchEnd);
			container.removeEventListener('wheel', handleWheel);
		};
	}, [onZoomIn, onZoomOut, onPan]);

	return (
		<div ref={containerRef} className='w-full h-full pointer-events-auto'>
			{children}
		</div>
	);
};
