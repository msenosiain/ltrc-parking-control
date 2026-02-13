// Member types
export interface Member {
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  apartmentNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMemberDto {
  name: string;
  email: string;
  phone?: string;
  apartmentNumber?: string;
}

export interface UpdateMemberDto {
  name?: string;
  email?: string;
  phone?: string;
  apartmentNumber?: string;
}

