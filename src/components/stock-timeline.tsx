'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ZoomIn, ZoomOut } from 'lucide-react';

import { cn } from '@/lib/utils';
import { generateSampleData } from '@/lib/stocks';
import { TradeDay, ZoomLevel } from '@/types/stocks';

import { GestureDetector } from './gesture-detector';

export const StockTimeline = () => {
	const [data] = useState(generateSampleData);
	const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(ZoomLevel.YEARS);
	const [selectedYear, setSelectedYear] = useState<number>(2025);
	const [selectedQuarter, setSelectedQuarter] = useState<number>(0); // 0-3 for quarters

	const containerRef = useRef<HTMLDivElement>(null);
	const controls = useAnimation();

	const handleZoomIn = () => {
		if (zoomLevel === ZoomLevel.YEARS) {
			setZoomLevel(ZoomLevel.MONTHS);
			controls.start({ scale: 1, opacity: 1 });
		} else if (zoomLevel === ZoomLevel.MONTHS) {
			setZoomLevel(ZoomLevel.DAYS);
			controls.start({ scale: 1, opacity: 1 });
		}
	};

	const handleZoomOut = () => {
		if (zoomLevel === ZoomLevel.DAYS) {
			setZoomLevel(ZoomLevel.MONTHS);
			controls.start({ scale: 1, opacity: 1 });
		} else if (zoomLevel === ZoomLevel.MONTHS) {
			setZoomLevel(ZoomLevel.YEARS);
			controls.start({ scale: 1, opacity: 1 });
		}
	};

	const selectYear = (year: number) => {
		console.log('selectYear', year);
		setSelectedYear(year);
		handleZoomIn();
	};

	const selectQuarter = (quarter: number) => {
		console.log('selectQuarter', quarter);
		setSelectedQuarter(quarter);
		handleZoomIn();
	};

	const getDaysForSelectedQuarter = () => {
		const yearData = data.find((y) => y.year === selectedYear);
		if (!yearData) return [];

		const startMonth = selectedQuarter * 3;
		const endMonth = startMonth + 2;

		const days: TradeDay[] = [];
		for (let m = startMonth; m <= endMonth; m++) {
			if (yearData.months[m]) {
				days.push(...yearData.months[m].days);
			}
		}

		return days;
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

	return (
		<GestureDetector
			onZoomIn={handleZoomIn}
			onZoomOut={handleZoomOut}
			onPan={(deltaX) => {
				// We're using Framer Motion's built-in drag for panning in the days view
				// This onPan handler is kept for potential future use
			}}>
			<div
				className='relative w-full h-[600px] overflow-hidden bg-gray-50 p-4'
				ref={containerRef}>
				<div className='text-center mb-6'>
					<h2 className='text-xl font-semibold'>
						{zoomLevel === ZoomLevel.YEARS && '2024 - 2030'}
						{zoomLevel === ZoomLevel.MONTHS && `Year of ${selectedYear}`}
						{zoomLevel === ZoomLevel.DAYS &&
							`${getQuarterLabel(selectedQuarter)} ${selectedYear} (90 days)`}
					</h2>
				</div>

				<div className='absolute top-4 right-4 flex gap-2 z-10'>
					<button
						onClick={handleZoomIn}
						disabled={zoomLevel === ZoomLevel.DAYS}
						className='p-2 bg-white rounded-full shadow-md disabled:opacity-50'
						aria-label='Zoom in'>
						<ZoomIn className='w-5 h-5' />
					</button>
					<button
						onClick={handleZoomOut}
						disabled={zoomLevel === ZoomLevel.YEARS}
						className='p-2 bg-white rounded-full shadow-md disabled:opacity-50'
						aria-label='Zoom out'>
						<ZoomOut className='w-5 h-5' />
					</button>
				</div>

				<AnimatePresence mode='wait'>
					{zoomLevel === ZoomLevel.YEARS && (
						<motion.div
							key='years'
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 1.1 }}
							transition={{ duration: 0.3 }}
							className='flex flex-col items-center justify-center h-full relative z-[1]'>
							<div className='w-full max-w-7xl border border-gray-200 rounded-lg overflow-hidden'>
								<div className='flex w-full'>
									{data.map((yearData) => (
										<motion.button
											key={yearData.year}
											className={cn(
												'flex-1 py-6 text-center bg-green-100 border-r border-gray-300 last:border-r-0 cursor-pointer',
												selectedYear === yearData.year && 'bg-green-200'
											)}
											whileHover={{
												backgroundColor: 'rgba(167, 243, 208, 0.8)',
											}}
											onClick={() => selectYear(yearData.year)}>
											{yearData.year}
										</motion.button>
									))}
								</div>
							</div>
							<div className='mt-4 text-sm text-gray-500'>
								Click on a year to zoom in
							</div>
						</motion.div>
					)}

					{zoomLevel === ZoomLevel.MONTHS && (
						<motion.div
							key='months'
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 1.1 }}
							transition={{ duration: 0.3 }}
							className='flex flex-col items-center justify-center h-full relative z-[1]'>
							<div className='w-full max-w-3xl border border-gray-200 rounded-lg overflow-hidden'>
								<div className='flex w-full'>
									{[0, 1, 2, 3].map((quarter) => (
										<motion.button
											key={quarter}
											className={cn(
												'flex-1 py-6 text-center bg-green-100 border-r border-gray-300 last:border-r-0',
												selectedQuarter === quarter && 'bg-green-200'
											)}
											whileHover={{
												backgroundColor: 'rgba(167, 243, 208, 0.8)',
											}}
											onClick={() => selectQuarter(quarter)}>
											{getQuarterLabel(quarter)}
										</motion.button>
									))}
								</div>
							</div>
							<div className='mt-4 text-sm text-gray-500'>
								Click on a quarter to zoom in
							</div>
						</motion.div>
					)}

					{zoomLevel === ZoomLevel.DAYS && (
						<motion.div
							key='days'
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 1.1 }}
							transition={{ duration: 0.3 }}
							className='flex flex-col items-center h-full relative z-[1]'>
							<div className='relative w-full h-70 mt-10 overflow-hidden z-[1]'>
								<div className='absolute top-1/2 left-0 right-0 h-px bg-gray-300'></div>

								<motion.div
									className='relative h-full w-[1000px]'
									drag='x'
									dragConstraints={{ left: -9000, right: 0 }}
									dragElastic={0.1}
									dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}>
									{getDaysForSelectedQuarter().map((day, index) => {
										const size = Math.abs(day.profit) / 10 + 30;
										const position = (index / 9) * 100;

										return (
											<motion.div
												key={index}
												className={cn(
													'group absolute top-1/2 transform -translate-y-1/2 rounded-full flex items-center justify-center',
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
															? 'rotate(0deg) translate(-50%, -50%)'
															: 'rotate(180deg) translate(50%, 50%)',
														top: '50%',
														left: '50%',
													}}
												/>

												<motion.div
													className='absolute -top-16 bg-yellow-100 px-3 py-1 rounded-md border border-yellow-300 text-sm group-hover:opacity-100 opacity-0'
													transition={{ delay: 0.5 }}>
													<div className='absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-yellow-100 border-r border-b border-yellow-300'></div>
													<span className='font-medium text-center w-fit'>
														{day.monthDay}
													</span>
												</motion.div>
											</motion.div>
										);
									})}
								</motion.div>
							</div>

							<div className='mt-4 text-sm text-gray-500'>
								Drag horizontally to see more days
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</GestureDetector>
	);
};
