
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'police';
  phone?: string;
  address?: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  type: 'car' | 'truck' | 'bus' | 'motorcycle';
  registrationDocument?: string;
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  licenseNumber: string;
  phone: string;
  experience: number;
  licenseDocument?: string;
}

export interface Trip {
  id: string;
  userId: string;
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  remarks?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'citizen' | 'police') => Promise<boolean>;
  register: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}
