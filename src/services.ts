import { BeautyService, OfferDeal, Review } from "./types";

export const DEFAULT_SERVICES: BeautyService[] = [
  {
    id: "bridal_makeup",
    name: "Couture Bridal Makeover",
    category: "Bridal",
    description: "An signature bridal makeover with premium hydrating cream prep, full customized airbrushing, lightweight 3D luxury lashes, and 16h flawless setting treatment.",
    originalPrice: 9999,
    discountPrice: 6999,
    duration: "150 mins",
    rating: 4.9,
    reviewsCount: 148,
    image: "https://images.unsplash.com/photo-1610189012903-8829ef31abaf?w=600&auto=format&fit=crop&q=80",
    badge: "30% OFF",
    isTrending: true
  },
  {
    id: "party_makeup",
    name: "VIP Evening Party Glitz",
    category: "Party",
    description: "Elegant party look featuring customized soft-sculpt contouring, metallic or satin smokey shadow, and high-shine lip styling designed for beautiful camera capture.",
    originalPrice: 3499,
    discountPrice: 2499,
    duration: "75 mins",
    rating: 4.8,
    reviewsCount: 94,
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80",
    badge: "28% OFF",
    isTrending: false
  },
  {
    id: "hair_styling",
    name: "Avant-Garde Hair Styling",
    category: "Hair",
    description: "Includes professional deep wash, organic keratin shine coat, and a customized premium blow-dry or intricate hair-weaving updos tailored for your head shape.",
    originalPrice: 1999,
    discountPrice: 1299,
    duration: "60 mins",
    rating: 4.7,
    reviewsCount: 112,
    image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&auto=format&fit=crop&q=80",
    badge: "35% OFF",
    isTrending: true
  },
  {
    id: "skin_care_facial",
    name: "Elite Organic Hydrating Facial",
    category: "Facial",
    description: "Premium collagen booster facial utilizing volcanic quartz thermal massage, customized cold-pressed antioxidant serums, and gold leaf cell-renewal gel.",
    originalPrice: 2999,
    discountPrice: 1999,
    duration: "90 mins",
    rating: 4.9,
    reviewsCount: 86,
    image: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&auto=format&fit=crop&q=80",
    badge: "33% OFF",
    isTrending: true
  },
  {
    id: "luxury_spa_therapy",
    name: "Therapeutic Hot Stone Spa",
    category: "Spa",
    description: "Rejuvenating therapeutic massage with organic lavender-infused warm basalt stones, full core body alignment, and stress-fading aroma oil misting.",
    originalPrice: 4500,
    discountPrice: 3199,
    duration: "120 mins",
    rating: 4.9,
    reviewsCount: 74,
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80",
    badge: "29% OFF",
    isTrending: false
  },
  {
    id: "nail_art_couture",
    name: "Signature Gel Gelato Nail Art",
    category: "Nails",
    description: "Chic salon manicure with detailed custom hand painting, protective base wrap, and gorgeous semi-precious crystal detailing with extreme gloss coats.",
    originalPrice: 1499,
    discountPrice: 1099,
    duration: "50 mins",
    rating: 4.6,
    reviewsCount: 63,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&auto=format&fit=crop&q=80",
    badge: "26% OFF",
    isTrending: false
  },
  {
    id: "traditional_bridal_mehendi",
    name: "Classic Bridal Paisley Mehendi",
    category: "Mehendi",
    description: "Exquisite traditional Rajasthani or Arabic mehendi pattern flowing from fingers to elbows, crafted with premium organically sourced dark-glow henna paste.",
    originalPrice: 4999,
    discountPrice: 3499,
    duration: "180 mins",
    rating: 4.9,
    reviewsCount: 104,
    image: "https://images.unsplash.com/photo-1568910408466-231a4727dca5?w=600&auto=format&fit=crop&q=80",
    badge: "30% OFF",
    isTrending: true
  },
  {
    id: "premium_detox_peel",
    name: "Vitamin C Radiance Rebound Peel",
    category: "Skin Care",
    description: "Gentle medical-grade fruit enzyme facial peeling designed to restore active radiance, correct skin hyperpigmentation, and tighten epidermal pores.",
    originalPrice: 2499,
    discountPrice: 1799,
    duration: "45 mins",
    rating: 4.7,
    reviewsCount: 52,
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&auto=format&fit=crop&q=80",
    badge: "28% OFF",
    isTrending: false
  }
];

export const DEFAULT_OFFERS: OfferDeal[] = [
  {
    id: "festival_glow",
    title: "Festival Splendor Gift Set",
    description: "Get a complimentary Premium Keratin hair wash free with any Luxury Facial booking.",
    code: "FESTIVEGLOW",
    discountType: "percentage",
    discountValue: 15,
    minOrderAmount: 2000,
    expiryDate: "2026-10-31",
    category: "Festival Combo"
  },
  {
    id: "welcome_luxe",
    title: "Elite Member Kickoff",
    description: "Enjoy ₹500 off on your very first appointment with LuxeBeauty.",
    code: "WELCOME500",
    discountType: "fixed",
    discountValue: 500,
    minOrderAmount: 1500,
    expiryDate: "2026-12-31",
    category: "New Customer"
  },
  {
    id: "bridal_deluxe",
    title: "Bridal Suite Companion Deal",
    description: "Special ₹1000 cashback for early-season booking on Bridal package bundles.",
    code: "BRIDAL1000",
    discountType: "fixed",
    discountValue: 1000,
    minOrderAmount: 6000,
    expiryDate: "2026-09-30",
    category: "Bridal Deluxe"
  },
  {
    id: "nail_combo",
    title: "Nails & Mehendi Festival Combo",
    description: "Combine Bridal Mehendi and Nail Couture to claim 20% off on both.",
    code: "HENNAART",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 4000,
    expiryDate: "2026-08-15",
    category: "Referral & Bundles"
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev_1",
    serviceId: "bridal_makeup",
    serviceName: "Couture Bridal Makeover",
    userId: "us_1",
    userName: "Ananya Sharma",
    rating: 5,
    comment: "I booked the Couture Bridal Makeover for my wedding day. They made me feel like an absolute queen! The makeup did not smudge or look cakey even after 12 hours of photos and dance. Sophia was incredible!",
    date: "2026-05-12"
  },
  {
    id: "rev_2",
    serviceId: "skin_care_facial",
    serviceName: "Elite Organic Hydrating Facial",
    userId: "us_2",
    userName: "Priyah Patel",
    rating: 5,
    comment: "The thermal quartz massage during the Organic Hydrating Facial was relaxing. My dry skin is glowing and feels so soft. I will make this a monthly self-care ritual.",
    date: "2026-06-02"
  },
  {
    id: "rev_3",
    serviceId: "hair_styling",
    serviceName: "Avant-Garde Hair Styling",
    userId: "us_3",
    userName: "Jessica D'Souza",
    rating: 4,
    comment: "Excellent blowout and lovely braids. Lily understands thick hair very well. Highly recommended for party styling!",
    date: "2026-06-10"
  }
];

export const ARTISTS = [
  { name: "Sophia Harris", specialty: "Bridal Airbrush Master" },
  { name: "Lily Anderson", specialty: "Glow Skincare & Facials" },
  { name: "Chloe Bennett", specialty: "Artistic Hair Updos & Mehendi" },
  { name: "Mia Roberts", specialty: "Premium Gel Nails Stylist" }
];

export const BRANCHES = [
  { name: "LuxeBeauty Flagship, Royal Gardens (Mumbai)", address: "77 Elegant Boulevard, Royal Gardens" },
  { name: "LuxeBeauty Studio, Lavelle Road (Bangalore)", address: "12 Elite Orchid Towers, Lavelle Road" },
  { name: "LuxeBeauty Retreat, Connaught Place (New Delhi)", address: "9B Golden Arcade, Connaught Place" }
];

export const TIME_SLOTS = [
  "09:00 AM - 10:00 AM",
  "10:30 AM - 11:30 AM",
  "12:00 PM - 01:00 PM",
  "01:30 PM - 02:30 PM",
  "03:00 PM - 04:00 PM",
  "04:30 PM - 05:30 PM",
  "06:30 PM - 07:30 PM"
];
