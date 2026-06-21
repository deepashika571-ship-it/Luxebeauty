import { Booking, UserProfile, PaymentTransaction } from "../types";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xojoaekj";

/**
 * Dispatches a data payload to the Formspree endpoint when an action is completed
 * inside the beauty studio app. It handles errors gracefully to ensure offline/network
 * robustness.
 */
export async function sendFormspreeUpdate(
  type: "booking_request" | "booking_confirmed" | "payment" | "user_registered",
  payload: {
    booking?: Booking;
    userProfile?: UserProfile;
    payment?: PaymentTransaction;
    newStatus?: string;
  }
) {
  try {
    let formDetails: Record<string, any> = {
      _subject: `LuxeBeauty Notification: ${type.toUpperCase().replace("_", " ")}`,
      eventType: type,
      utcTimestamp: new Date().toISOString(),
      localTimestamp: new Date().toLocaleString(),
    };

    if (type === "booking_request" && payload.booking) {
      const b = payload.booking;
      formDetails = {
        ...formDetails,
        _subject: `New Salon Booking Request: ${b.serviceName} by ${b.userName}`,
        bookingId: b.id,
        serviceName: b.serviceName,
        bookingDate: b.date,
        timeSlot: b.timeSlot,
        artistSelected: b.artist,
        branchLocation: b.branch,
        customerName: b.userName,
        customerEmail: b.userEmail,
        customerPhone: b.userPhone,
        servicePrice: `₹${b.servicePrice}`,
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        bookingStatus: b.status,
        specialNotes: b.notes || "None",
      };
    } else if (type === "booking_confirmed" && payload.booking) {
      const b = payload.booking;
      formDetails = {
        ...formDetails,
        _subject: `Booking Confirmed: Approved for ${b.userName}`,
        bookingId: b.id,
        serviceName: b.serviceName,
        bookingDate: b.date,
        timeSlot: b.timeSlot,
        artistSelected: b.artist,
        branchLocation: b.branch,
        customerName: b.userName,
        customerEmail: b.userEmail,
        customerPhone: b.userPhone,
        servicePrice: `₹${b.servicePrice}`,
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        bookingStatus: payload.newStatus || b.status,
      };
    } else if (type === "payment" && payload.payment) {
      const p = payload.payment;
      formDetails = {
        ...formDetails,
        _subject: `Salon Payment Success: ₹${p.amount} from ${p.userName}`,
        paymentId: p.id,
        bookingId: p.bookingId,
        serviceName: p.serviceName,
        paidAmount: `₹${p.amount}`,
        paymentMethod: p.paymentMethod,
        upiIdUsed: p.upiIdUsed || "N/A",
        transactionRef: p.transactionRef,
        customerName: p.userName,
        customerEmail: p.userEmail,
        customerPhone: p.userPhone,
        paymentStatus: p.status,
      };
    } else if (type === "user_registered" && payload.userProfile) {
      const u = payload.userProfile;
      formDetails = {
        ...formDetails,
        _subject: `New Salon User Registered: ${u.fullName}`,
        userId: u.uid,
        customerName: u.fullName,
        customerEmail: u.email,
        customerPhone: u.phoneNumber,
        country: u.country,
        roleAssigned: u.role,
        referralCodeGenerated: u.referralCode,
        referredByUsed: u.referredBy || "None",
        initialLoyaltyPoints: u.loyaltyPoints,
        accountCreatedAt: u.createdAt,
      };
    }

    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(formDetails),
    });

    if (!response.ok) {
      console.warn(`Formspree submission returned status ${response.status}`);
    } else {
      console.log(`Successfully dispatched Formspree update for event: ${type}`);
    }
  } catch (error) {
    console.error(`Formspree transmission failed:`, error);
  }
}
