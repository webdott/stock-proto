export const isObjectCenteredHorizontally = (
	elementCenterX: number,
	centerX: number
) => {
	console.log(elementCenterX, centerX, 'here');
	return Math.abs(elementCenterX - centerX) < 20;
};
