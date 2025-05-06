export interface TradeDay {
	date: Date;
	monthDay: string;
	profit: number;
	isProfit: boolean;
}

export interface Month {
	name: string;
	days: TradeDay[];
}

export interface Year {
	year: number;
	months: Month[];
}

export enum ZoomLevel {
	YEARS = 0,
	MONTHS = 1,
	DAYS = 2,
}
