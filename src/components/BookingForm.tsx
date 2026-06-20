import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, User, Home, FileText, CheckCircle, HelpCircle } from "lucide-react";
import { Booking, BeautyService } from "../types";
import { DEFAULT_SERVICES, ARTISTS, BRANCHES, TIME_SLOTS } from "../services";

interface BookingFormProps {
  initialService?: BeautyService | null;
  currentUser: { uid: string; email: string; displayName?: string; phoneNumber?: string } | null;
  onSubmit: (bookingData: Omit<Booking, "id" | "createdAt">) => void;
  onCancel: () => void;
}

export default function BookingForm({ initialService, currentUser, onSubmit, onCancel }: BookingFormProps) {
  const [serviceId, setServiceId] = useState(initialService?.id || DEFAULT_SERVICES[0].id);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [artist, setArtist] = useState(ARTISTS[0].name);
  const [branch, setBranch] = useState(BRANCHES[0].name);
  const [notes, setNotes] = useState("");
  const [isVerifyingSlots, setIsVerifyingSlots] = useState(false);
  const [slotCheckMessage, setSlotCheckMessage] = useState("");
  const [validationError, setValidationError] = useState("");

  const selectedService = DEFAULT_SERVICES.find(s => s.id === serviceId) || DEFAULT_SERVICES[0];

  useEffect(() => {
    if (initialService) {
      setServiceId(initialService.id);
    }
  }, [initialService]);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const year = tomorrow.getFullYear();
    setDate(`${year}-${month}-${day}`);
  }, []);

  // Simulate slot availability check
  const handleVerifySlot = async () => {
    if (!date) return;
    setIsVerifyingSlots(true);
    setSlotCheckMessage("");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simple mock logic for availability
    const isAvailable = Math.random() > 0.15; // 85% chance of being free
    if (isAvailable) {
      setSlotCheckMessage(`✓ Standard time slot is available under artist ${artist}!`);
    } else {
      setSlotCheckMessage(`⚠ The requested slot for ${artist} is booked. Our Concierge recommends picking "04:30 PM - 05:30 PM" or choosing Lily Anderson.`);
    }
    setIsVerifyingSlots(false);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!currentUser) {
      setValidationError("You must be registered and logged in to secure a slot booking.");
      return;
    }

    if (!date) {
      setValidationError("Please select a preferred date for your styling treatment.");
      return;
    }

    // Pass data back upward to show checkout gateway
    onSubmit({
      userId: currentUser.uid,
      userEmail: currentUser.email,
      userName: currentUser.displayName || "Luxe Member",
      userPhone: currentUser.phoneNumber || "+91 98765 43210",
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      serviceCategory: selectedService.category,
      servicePrice: selectedService.discountPrice,
      date,
      timeSlot,
      artist,
      branch,
      notes,
      paymentMethod: "upi",
      paymentStatus: "pending",
      status: "pending",
    });
  };

  return (
    <div id="booking-form-window" className="max-w-2xl mx-auto bg-white/95 dark:bg-zinc-900/95 border border-pink-100 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 md:p-8 text-zinc-900 dark:text-zinc-100 font-sans">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h3 className="font-serif text-2xl text-zinc-900 dark:text-amber-50 font-medium">Schedule Beauty Appointment</h3>
          <p className="text-xs text-rose-500 dark:text-rose-400 font-semibold uppercase tracking-wider mt-1">Luxe Menu Reservation</p>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700 bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {validationError && (
        <div className="mb-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs p-3 rounded-xl">
          {validationError}
        </div>
      )}

      <form onSubmit={handleBookingSubmit} className="space-y-6">
        {/* Service Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Select Beauty Treatment</label>
          <div className="relative">
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-850 dark:text-zinc-150 outline-none focus:border-pink-300"
            >
              {DEFAULT_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — (₹{s.discountPrice})
                </option>
              ))}
            </select>
          </div>
          {selectedService && (
            <p className="text-xs text-zinc-500 mt-2 italic">
              {selectedService.description} • Price: <span className="text-rose-500 font-bold font-mono text-xs">₹{selectedService.discountPrice}</span> (was ₹{selectedService.originalPrice})
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" /> Date Selection
            </label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setSlotCheckMessage("");
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-300"
            />
          </div>

          {/* Time Slots */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Preferred Hour Slot
            </label>
            <select
              value={timeSlot}
              onChange={(e) => {
                setTimeSlot(e.target.value);
                setSlotCheckMessage("");
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-300"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          {/* Beauty Artist Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Style Therapist / Artist
            </label>
            <select
              value={artist}
              onChange={(e) => {
                setArtist(e.target.value);
                setSlotCheckMessage("");
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-300"
            >
              {ARTISTS.map((art) => (
                <option key={art.name} value={art.name}>
                  {art.name} ({art.specialty})
                </option>
              ))}
            </select>
          </div>

          {/* Address Branches */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> Suite / branch Location
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-300"
            >
              {BRANCHES.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name.split(',')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Verification Trigger with Loading */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-natural-bg p-4 rounded-xl border border-natural-border">
          <HelpCircle className="w-5 h-5 text-natural-gold shrink-0" />
          <div className="flex-1">
            <p className="text-[11px] text-natural-muted">Validate real-time slot bookings on our secure servers prior to checkout.</p>
            {slotCheckMessage && (
              <p className={`text-xs font-semibold mt-1 ${slotCheckMessage.startsWith("✓") ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"}`}>
                {slotCheckMessage}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={isVerifyingSlots}
            onClick={handleVerifySlot}
            className="text-[10px] bg-natural-text hover:bg-natural-charcoal text-white font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
          >
            {isVerifyingSlots ? "Checking..." : "Verify Slot"}
          </button>
        </div>

        {/* Custom Request Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-natural-muted mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-natural-gold" /> Special Requests & Styling Notes
          </label>
          <textarea
            placeholder="e.g. skin allergies, product preferences, or special access requests..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-natural-bg border border-natural-border rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-natural-gold"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#4A3F3B] hover:bg-[#3D3330] text-white font-bold tracking-widest text-xs uppercase px-6 py-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none cursor-pointer border border-natural-gold/15"
        >
          Proceed Booking Request (₹{selectedService.discountPrice})
        </button>
      </form>
    </div>
  );
}
