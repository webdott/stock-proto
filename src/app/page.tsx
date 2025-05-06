import { StockTimeline } from '@/components/stock-timeline';

export default function Home() {
	return (
		<main className='flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50'>
			<h1 className='text-2xl font-bold mb-6'>Stock Timeline Prototype</h1>
			<p className='text-sm text-gray-500 mb-8 max-w-md text-center'>
				Pinch to zoom or use the zoom controls to navigate between years,
				months, and individual trading days
			</p>
			<div className='w-full max-w-[1920px] bg-white rounded-lg border border-gray-200 overflow-hidden'>
				<StockTimeline />
			</div>
		</main>
	);
}
