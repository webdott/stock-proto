'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
	motion,
	AnimatePresence,
	useMotionValue,
	useSpring,
} from 'framer-motion';
import { ZoomIn, ZoomOut, MoveHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedCallback } from 'use-debounce';

import { generateSampleData } from '@/lib/stocks';
import { TradeDay, ZoomLevel } from '@/types/stocks';

export const StockTimeline = () => {
	const [data] = useState(generateSampleData);
	const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(ZoomLevel.YEARS);
	const [selectedYear, setSelectedYear] = useState<number | null>(null);
	const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
	const [focusedYearIndex, setFocusedYearIndex] = useState<number | null>(null);
	const [focusedQuarterIndex, setFocusedQuarterIndex] = useState<number | null>(
		null
	);
	const [isTransitioning, setIsTransitioning] = useState(false);

	const containerRef = useRef<HTMLDivElement>(null);
	const yearsContainerRef = useRef<HTMLDivElement>(null);
	const monthsContainerRef = useRef<HTMLDivElement>(null);

	const zoomFactor = useMotionValue(1);
	const springZoom = useSpring(zoomFactor, { stiffness: 300, damping: 30 });

	const initialPinchDistance = useRef<number | null>(null);
	const lastPinchCenter = useRef<{ x: number; y: number } | null>(null);
	const isPinching = useRef(false);

	const handleZoomTransition = useDebouncedCallback(
		(nextLevel: ZoomLevel, targetYear?: number, targetQuarter?: number) => {
			if (isTransitioning) return;

			setIsTransitioning(true);

			// Reset zoom and pan for the transition
			setTimeout(() => {
				zoomFactor.set(1);

				if (targetYear !== undefined) {
					setSelectedYear(targetYear);
				}

				if (targetQuarter !== undefined) {
					setSelectedQuarter(targetQuarter);
				}

				setZoomLevel(nextLevel);
				setIsTransitioning(false);
				setFocusedYearIndex(null);
				setFocusedQuarterIndex(null);
			}, 300);
		},
		300
	);

	const handleZoom = useCallback(
		(newZoom: number) => {
			if (newZoom >= 4.8) {
				if (zoomLevel === ZoomLevel.YEARS && focusedYearIndex !== null) {
					const year = data[focusedYearIndex].year;
					handleZoomTransition(ZoomLevel.MONTHS, year);
				} else if (
					zoomLevel === ZoomLevel.MONTHS &&
					focusedQuarterIndex !== null
				) {
					handleZoomTransition(ZoomLevel.DAYS, undefined, focusedQuarterIndex);
				}
			} else if (newZoom <= 0.9) {
				if (zoomLevel === ZoomLevel.DAYS) {
					handleZoomTransition(ZoomLevel.MONTHS);
				} else if (zoomLevel === ZoomLevel.MONTHS) {
					handleZoomTransition(ZoomLevel.YEARS);
				}
			}
		},
		[zoomLevel, focusedYearIndex, focusedQuarterIndex]
	);

	// Handle manual zoom in button click
	const handleZoomInClick = () => {
		handleBoxInCenter();
		zoomFactor.set(Math.min(Math.max(zoomFactor.get() + 0.9, 0.9), 5));
		handleZoom(zoomFactor.get());
	};

	// Handle manual zoom out button click
	const handleZoomOutClick = () => {
		handleBoxInCenter();
		zoomFactor.set(Math.max(zoomFactor.get() - 0.9, 0.9));
		handleZoom(zoomFactor.get());
	};

	const handleBoxInCenter = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		const containerRect = container.getBoundingClientRect();
		const centerX = container.getBoundingClientRect().width / 2;
		let closestDistance = Infinity;

		if (zoomLevel === ZoomLevel.YEARS) {
			const yearContainer = yearsContainerRef.current;
			if (!yearContainer) return;

			const yearElements = yearContainer.querySelectorAll('[data-year-index]');
			let closestYearIndex = null;

			yearElements.forEach((el, idx) => {
				const rect = el.getBoundingClientRect();

				const elementCenterX = rect.left + rect.width / 2 - containerRect.left;

				closestDistance = Math.min(
					closestDistance,
					Math.abs(elementCenterX - centerX)
				);

				if (closestDistance === Math.abs(elementCenterX - centerX)) {
					closestYearIndex = idx;
				}
			});

			setFocusedYearIndex(closestYearIndex);
		} else if (zoomLevel === ZoomLevel.MONTHS) {
			const monthContainer = monthsContainerRef.current;
			if (!monthContainer) return;

			const quarterElements = monthContainer.querySelectorAll(
				'[data-quarter-index]'
			);
			let closestQuarterIndex = null;

			quarterElements.forEach((el, idx) => {
				const rect = el.getBoundingClientRect();

				const elementCenterX = rect.left + rect.width / 2 - containerRect.left;

				closestDistance = Math.min(
					closestDistance,
					Math.abs(elementCenterX - centerX)
				);

				if (closestDistance === Math.abs(elementCenterX - centerX)) {
					closestQuarterIndex = idx;
				}
			});

			setFocusedQuarterIndex(closestQuarterIndex);
		}
	}, [zoomLevel]);

	const handlePinchStart = (distance: number) => {
		initialPinchDistance.current = distance;
		isPinching.current = true;
	};

	const handlePinchMove = (distance: number) => {
		if (
			!initialPinchDistance.current ||
			!lastPinchCenter.current ||
			!isPinching.current
		)
			return;

		handleBoxInCenter();

		const zoomChange = distance / initialPinchDistance.current;
		const newZoom = Math.min(Math.max(zoomFactor.get() * zoomChange, 0.8), 3);
		zoomFactor.set(newZoom);

		handleZoom(newZoom);
	};

	const handlePinchEnd = () => {
		initialPinchDistance.current = null;
		lastPinchCenter.current = null;
		isPinching.current = false;

		// Reset zoom factor with spring animation
		if (zoomFactor.get() < 1.5 && zoomFactor.get() > 0.9) {
			zoomFactor.set(1);
		}
	};

	const getQuarterLabel = (quarter: number) => {
		const startMonth = quarter * 3;
		const endMonth = startMonth + 2;
		const monthNames = [
			'Jan',
			'Feb',
			'Mar',
			'Apr',
			'May',
			'Jun',
			'Jul',
			'Aug',
			'Sep',
			'Oct',
			'Nov',
			'Dec',
		];
		return `${monthNames[startMonth]}-${monthNames[endMonth]}`;
	};

	const getDaysForSelectedQuarter = () => {
		const yearData = data.find((y) => y.year === selectedYear);
		if (!yearData) return [];

		const startMonth = (selectedQuarter ?? 0) * 3;
		const endMonth = startMonth + 2;

		const days: TradeDay[] = [];
		for (let m = startMonth; m <= endMonth; m++) {
			if (yearData.months[m]) {
				days.push(...yearData.months[m].days);
			}
		}

		return days;
	};

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const getTouchDistance = (touches: TouchList): number => {
			if (touches.length < 2) return 0;

			const dx = touches[0].clientX - touches[1].clientX;
			const dy = touches[0].clientY - touches[1].clientY;
			return Math.sqrt(dx * dx + dy * dy);
		};

		const handleTouchStart = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				const distance = getTouchDistance(e.touches);
				handlePinchStart(distance);
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			if (e.touches.length === 2) {
				const distance = getTouchDistance(e.touches);
				handlePinchMove(distance);
			}
		};

		const handleTouchEnd = () => {
			handlePinchEnd();
		};

		// Wheel handler for desktop zoom
		const handleWheel = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();

				handleBoxInCenter();

				const delta = -e.deltaY * 0.01;
				const newZoom = Math.min(
					Math.max(zoomFactor.get() * (1 + delta), 0.8),
					5
				);
				zoomFactor.set(newZoom);

				handleZoom(newZoom);
			}
		};

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
	}, [
		zoomLevel,
		data,
		focusedYearIndex,
		focusedQuarterIndex,
		handleZoomTransition,
	]);

	return (
		<div
			className='relative w-full h-[600px] overflow-hidden bg-gray-50 p-4 cursor-grab'
			ref={containerRef}>
			<div className='text-center mb-6'>
				<h2 className='text-xl font-semibold'>
					{zoomLevel === ZoomLevel.YEARS && '2024 - 2030'}
					{zoomLevel === ZoomLevel.MONTHS && `Year of ${selectedYear}`}
					{zoomLevel === ZoomLevel.DAYS &&
						`${getQuarterLabel(
							selectedQuarter ?? 0
						)} ${selectedYear} (90 days)`}
				</h2>
			</div>

			<div className='absolute top-4 right-4 flex gap-2 z-10'>
				<button
					onClick={handleZoomInClick}
					disabled={zoomLevel === ZoomLevel.DAYS || isTransitioning}
					className='p-2 bg-white rounded-full shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed'
					aria-label='Zoom in'>
					<ZoomIn className='w-5 h-5' />
				</button>
				<button
					onClick={handleZoomOutClick}
					disabled={zoomLevel === ZoomLevel.YEARS || isTransitioning}
					className='p-2 bg-white rounded-full shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed'
					aria-label='Zoom out'>
					<ZoomOut className='w-5 h-5' />
				</button>
			</div>

			<AnimatePresence mode='wait'>
				{zoomLevel === ZoomLevel.YEARS && (
					<motion.div
						key='years'
						ref={yearsContainerRef}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						drag='x'
						dragConstraints={{ left: -1200, right: 1200 }}
						dragElastic={0.1}
						dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
						className='flex flex-col items-center justify-center h-full'
						style={{
							scale: springZoom,
						}}>
						<div className='w-full max-w-3xl border border-gray-200 rounded-lg overflow-hidden'>
							<div className='flex w-full'>
								{data.map((yearData, index) => (
									<motion.div
										key={yearData.year}
										className={cn(
											'flex-1 py-6 text-center border-r border-gray-300 last:border-r-0 cursor-pointer',
											focusedYearIndex === index
												? 'bg-green-300 scale-105 shadow-md z-10'
												: 'bg-green-100'
										)}
										data-year-index={index}
										animate={{
											scale: focusedYearIndex === index ? 1.05 : 1,
											backgroundColor:
												focusedYearIndex === index
													? 'rgba(134, 239, 172, 1)'
													: 'rgba(220, 252, 231, 1)',
										}}
										transition={{
											type: 'spring',
											stiffness: 300,
											damping: 30,
										}}>
										<span className='block font-medium'>{yearData.year}</span>
									</motion.div>
								))}
							</div>
						</div>
					</motion.div>
				)}

				{zoomLevel === ZoomLevel.MONTHS && (
					<motion.div
						key='months'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						drag='x'
						dragConstraints={{ left: -1200, right: 1200 }}
						dragElastic={0.1}
						dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
						className='flex flex-col items-center justify-center h-full'
						style={{
							scale: springZoom,
						}}
						ref={monthsContainerRef}>
						<div className='w-full max-w-3xl border border-gray-200 rounded-lg overflow-hidden'>
							<div className='flex w-full'>
								{[0, 1, 2, 3].map((quarter, index) => (
									<motion.div
										key={quarter}
										className={cn(
											'flex-1 py-6 text-center border-r border-gray-300 last:border-r-0 cursor-pointer',
											focusedQuarterIndex === index
												? 'bg-green-300 scale-105 shadow-md z-10'
												: 'bg-green-100'
										)}
										data-quarter-index={index}
										animate={{
											scale: focusedQuarterIndex === index ? 1.05 : 1,
											backgroundColor:
												focusedQuarterIndex === index
													? 'rgba(134, 239, 172, 1)'
													: 'rgba(220, 252, 231, 1)',
										}}
										transition={{
											type: 'spring',
											stiffness: 300,
											damping: 30,
										}}>
										<span className='block font-medium'>
											{getQuarterLabel(quarter)}
										</span>
									</motion.div>
								))}
							</div>
						</div>
					</motion.div>
				)}

				{zoomLevel === ZoomLevel.DAYS && (
					<motion.div
						key='days'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						className='flex flex-col items-center h-full'>
						<div className='relative w-full h-70 mt-10 overflow-hidden'>
							<div className='absolute top-1/2 left-0 right-0 h-px bg-gray-300'></div>

							<motion.div
								className='relative h-full w-[1000px]'
								drag='x'
								dragConstraints={{ left: -9000, right: 0 }}
								dragElastic={0.1}
								dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}>
								{getDaysForSelectedQuarter().map((day, index) => {
									const size = Math.abs(day.profit) / 10 + 30;
									const position = (index / 9) * 100;

									return (
										<motion.div
											key={index}
											className={cn(
												'absolute top-1/2 transform -translate-y-1/2 rounded-full flex items-center justify-center group',
												day.isProfit
													? 'bg-green-200/30 border-green-400'
													: 'bg-red-200/30 border-red-400'
											)}
											style={{
												width: size,
												height: size,
												left: `${position}%`,
												border: '1px solid',
											}}
											whileHover={{ scale: 1.1 }}>
											<motion.div
												className={cn(
													'absolute w-0 h-0 border-solid border-transparent',
													day.isProfit
														? 'border-t-green-500'
														: 'border-t-red-500'
												)}
												style={{
													borderWidth: '8px',
													borderTopWidth: '12px',
													transform: day.isProfit
														? 'rotate(0deg)'
														: 'rotate(180deg)',
													top: day.isProfit ? 'auto' : '50%',
													bottom: day.isProfit ? '50%' : 'auto',
												}}
											/>

											<motion.div
												className='absolute min-w-[80px] flex items-center justify-center -top-16 bg-yellow-100 px-3 py-1 rounded-md border border-yellow-300 text-sm group-hover:opacity-100 opacity-0'
												transition={{ delay: 0.5 }}>
												<div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-yellow-100 border-r border-b border-yellow-300'></div>
												<span className='font-medium w-fit text-center '>
													{day.monthDay}
												</span>
											</motion.div>
										</motion.div>
									);
								})}
							</motion.div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{zoomLevel === ZoomLevel.DAYS ? (
				<div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 px-4 py-2 rounded-full shadow-md text-sm text-gray-700 flex items-center gap-2'>
					<MoveHorizontal className='w-4 h-4' />
					<span>Drag horizontally to see more days</span>
				</div>
			) : (
				<div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 px-4 py-2 rounded-full shadow-md text-sm text-gray-700 flex items-center gap-2'>
					<ZoomIn className='w-4 h-4' />
					<span>Pinch to zoom, drag to pan</span>
				</div>
			)}
		</div>
	);
};
