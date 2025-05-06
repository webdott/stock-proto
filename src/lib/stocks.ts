import { Month, Year, TradeDay } from '@/types/stocks';

export const generateSampleData = (): Year[] => {
	const years: Year[] = [];

	for (let y = 2024; y <= 2030; y++) {
		const months: Month[] = [];

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

		for (let m = 0; m < 12; m++) {
			const days: TradeDay[] = [];
			const daysInMonth = new Date(y, m + 1, 0).getDate();

			for (let d = 1; d <= daysInMonth; d++) {
				const date = new Date(y, m, d);
				const isProfit = Math.random() > 0.4;
				days.push({
					date,
					monthDay: `${monthNames[date.getMonth()]} ${date.getDate()}`,
					profit: Math.random() * 1000 * (isProfit ? 1 : -1),
					isProfit,
				});
			}

			months.push({
				name: monthNames[m],
				days,
			});
		}

		years.push({
			year: y,
			months,
		});
	}

	return years;
};
