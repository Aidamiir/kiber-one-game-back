export interface UpdateUserDataInterface {
	id: string;
	balance?: number;
	energy?: number;
	balanceAmount?: number;
	energyAmount?: number;
	lastEnergyUpdate?: Date;
	quantityEnergyBoost?: number;
	quantityTurboBoost?: number;
	lastEnergyBoostUpdate?: Date;
	lastTurboBoostUpdate?: Date;
}
