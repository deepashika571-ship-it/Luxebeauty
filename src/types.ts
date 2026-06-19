export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  country: string;
  role: 'user' | 'admin';
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
  wishlist: string[]; // List of BeautyService.id
  createdAt: string;
}

export interface BeautyService {
  id: string;
  name: string;
  category: 'Bridal' | 'Party' | 'Hair' | 'Facial' | 'Skin Care' | 'Nails' | 'Mehendi' | 'Spa';
  description: string;
  originalPrice: number;
  discountPrice: number;
  duration: string; // e.g. "60 mins"
  rating: number;
  reviewsCount: number;
  image: string;
  badge?: string; // e.g. "20% OFF"
  isTrending?: boolean;
}

export type PaymentMethod = 'upi' | 'card' | 'netbanking' | 'wallet' | 'cash';
export type PaymentStatus = 'pending' | 'paid' | 'unpaid';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string;
  servicePrice: number;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "10:00 AM - 11:00 AM"
  artist: string; // e.g., "Sophia Harris"
  branch: string; // e.g., "Downtown Luxury Spa"
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  invoiceId?: string;
  createdAt: string;
}

export interface OfferDeal {
  id: string;
  title: string;
  description: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  expiryDate: string;
  category?: string;
}

export interface Review {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  photoUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  read: boolean;
  timestamp: string;
}
