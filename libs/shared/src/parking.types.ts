// Parking types
export interface ParkingSpace {
  _id?: string;
  spaceNumber: number;
  isOccupied: boolean;
  occupiedBy?: string; // Member ID
  occupiedAt?: Date;
  memberName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ParkingStats {
  totalSpaces: number;
  occupiedSpaces: number;
  availableSpaces: number;
  occupancyRate: number;
}

