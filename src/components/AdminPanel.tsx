import React, { useState } from "react";
import { Plus, Edit2, Trash2, Calendar, Clipboard, Users, ShieldAlert, CheckCircle, Clock, X, Sparkles } from "lucide-react";
import { BeautyService, Booking, UserProfile, OfferDeal } from "../types";
import { DEFAULT_SERVICES, DEFAULT_OFFERS } from "../services";

interface AdminPanelProps {
  services: BeautyService[];
  bookings: Booking[];
  users: UserProfile[];
  offers: OfferDeal[];
  onAddService: (service: BeautyService) => void;
  onDeleteService: (id: string) => void;
  onUpdateService: (service: BeautyService) => void;
  onUpdateBookingStatus: (id: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') => void;
  onAddOffer: (offer: OfferDeal) => void;
  onDeleteOffer: (id: string) => void;
}

export default function AdminPanel({
  services,
  bookings,
  users,
  offers,
  onAddService,
  onDeleteService,
  onUpdateService,
  onUpdateBookingStatus,
  onAddOffer,
  onDeleteOffer,
}: AdminPanelProps) {
  const [adminTab, setAdminTab] = useState<"services" | "bookings" | "users" | "offers">("bookings");
  
  // Service Creator Form Fields
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState<"Bridal" | "Party" | "Hair" | "Facial" | "Skin Care" | "Nails" | "Mehendi" | "Spa">("Party");
  const [newServicePrice, setNewServicePrice] = useState(3000);
  const [newServiceDiscount, setNewServiceDiscount] = useState(2500);
  const [newServiceDuration, setNewServiceDuration] = useState("60 mins");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServiceImg, setNewServiceImg] = useState("");

  // Offer Creator Form Fields
  const [newOfferTitle, setNewOfferTitle] = useState("");
  const [newOfferCode, setNewOfferCode] = useState("");
  const [newOfferValue, setNewOfferValue] = useState(20);
  const [newOfferType, setNewOfferType] = useState<'percentage' | 'fixed'>("percentage");

  const [activeNotification, setActiveNotification] = useState("");

  const triggerNotify = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => setActiveNotification(""), 3000);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServiceDesc) return;

    const added: BeautyService = {
      id: `srv_${Date.now()}`,
      name: newServiceName,
      category: newServiceCategory,
      description: newServiceDesc,
      originalPrice: Number(newServicePrice),
      discountPrice: Number(newServiceDiscount),
      duration: newServiceDuration,
      rating: 4.8,
      reviewsCount: 1,
      image: newServiceImg || "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80",
      badge: `${Math.round(((newServicePrice - newServiceDiscount) / newServicePrice) * 100)}% OFF`,
    };

    onAddService(added);
    triggerNotify(`Service "${newServiceName}" added successfully to Firestore!`);
    
    // reset form
    setNewServiceName("");
    setNewServiceDesc("");
    setNewServiceImg("");
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferTitle || !newOfferCode) return;

    const added: OfferDeal = {
      id: `off_${Date.now()}`,
      title: newOfferTitle,
      description: `Get absolute ${newOfferType === "percentage" ? `${newOfferValue}%` : `₹${newOfferValue}`} off on your beauty care.`,
      code: newOfferCode.toUpperCase().trim(),
      discountType: newOfferType,
      discountValue: Number(newOfferValue),
      minOrderAmount: 1500,
      expiryDate: "2026-11-30",
    };

    onAddOffer(added);
    triggerNotify(`Promo Voucher "${newOfferCode}" activated successfully!`);
    
    setNewOfferTitle("");
    setNewOfferCode("");
  };

  return (
    <div id="admin-workspace" className="bg-white/90 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden font-sans">
      {/* Upper Tab Panel */}
      <div className="bg-zinc-850 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-serif text-2xl font-medium tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500 animate-pulse" />
            LuxeBeauty Admin Console (CRUD)
          </h3>
          <p className="text-[11px] text-zinc-350 uppercase tracking-widest mt-1">Salon Operations & Inventory Terminal</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => setAdminTab("bookings")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              adminTab === "bookings" ? "bg-amber-500 text-zinc-900" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            Manage Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setAdminTab("services")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              adminTab === "services" ? "bg-amber-500 text-zinc-900" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            Menu Services ({services.length})
          </button>
          <button
            onClick={() => setAdminTab("offers")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              adminTab === "offers" ? "bg-amber-500 text-zinc-900" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            Coupon Offers ({offers.length})
          </button>
          <button
            onClick={() => setAdminTab("users")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              adminTab === "users" ? "bg-amber-500 text-zinc-900" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            Registered Users ({users.length})
          </button>
        </div>
      </div>

      {activeNotification && (
        <div className="bg-emerald-500 text-white text-xs p-3 font-semibold text-center animate-fade-in">
          {activeNotification}
        </div>
      )}

      {/* Main Container */}
      <div className="p-6">
        {/* Bookings View */}
        {adminTab === "bookings" && (
          <div className="space-y-6">
            <h4 className="font-serif text-lg text-zinc-850 font-medium">Recent Appointment Transactions</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 uppercase text-zinc-500 font-bold">
                    <th className="p-3">Ref ID</th>
                    <th className="p-3">Guest Name / Email</th>
                    <th className="p-3">Treatment / Price</th>
                    <th className="p-3">Date & Slot</th>
                    <th className="p-3">Artist assigned</th>
                    <th className="p-3">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-zinc-50/50">
                      <td className="p-3 font-mono font-bold text-natural-gold">{b.id.split('_')[1] || b.id}</td>
                      <td className="p-3">
                        <p className="font-bold">{b.userName}</p>
                        <p className="text-[10px] text-zinc-500">{b.userEmail}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold">{b.serviceName}</p>
                        <p className="text-[10px] text-natural-gold font-bold">₹{b.servicePrice}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{b.date}</p>
                        <p className="text-[10px] text-zinc-500">{b.timeSlot.split(' - ')[0]}</p>
                      </td>
                      <td className="p-3 text-[11px] text-zinc-700">{b.artist}</td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, "confirmed")}
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-emerald-100 cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, "completed")}
                            className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-blue-100 cursor-pointer"
                          >
                            Done
                          </button>
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, "cancelled")}
                            className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-red-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-6 text-zinc-400">No appointments scheduled today.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Services Inventory View */}
        {adminTab === "services" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Create Service Form (WRITE) */}
            <form onSubmit={handleCreateService} className="lg:col-span-5 bg-zinc-50/50 p-5 rounded-2xl border border-natural-border space-y-4">
              <h4 className="font-serif text-base font-semibold text-[#4A3F3B] flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-natural-gold" />
                Add Premium Service
              </h4>
              
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-zinc-600">Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Velvet Lip Airbrushing"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-natural-gold focus:border-natural-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-600">Category</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e: any) => setNewServiceCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-natural-gold focus:border-natural-gold"
                  >
                    <option value="Bridal">Bridal</option>
                    <option value="Party">Party</option>
                    <option value="Hair">Hair</option>
                    <option value="Facial">Facial</option>
                    <option value="Skin Care">Skin Care</option>
                    <option value="Nails">Nails</option>
                    <option value="Mehendi">Mehendi</option>
                    <option value="Spa">Spa</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-600">Duration</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 75 mins"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-600">Original (₹)</label>
                  <input
                    type="number"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-600">Offer Rate (₹)</label>
                  <input
                    type="number"
                    required
                    value={newServiceDiscount}
                    onChange={(e) => setNewServiceDiscount(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-zinc-600">Cover Image URL</label>
                <input
                  type="url"
                  placeholder="Paste Unsplash landscape URL..."
                  value={newServiceImg}
                  onChange={(e) => setNewServiceImg(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-zinc-600">Details Description</label>
                <textarea
                  required
                  placeholder="Describe treatment process, skin matches, etc..."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#4A3F3B] hover:bg-[#3D3330] text-white font-bold tracking-widest text-[11px] uppercase py-3 rounded-lg shadow cursor-pointer transition-all border border-natural-gold/15"
              >
                Create Beauty Service
              </button>
            </form>

            {/* Read/Delete Services list (READ & DELETE) */}
            <div className="lg:col-span-7 space-y-4">
              <h4 className="font-serif text-base font-semibold text-zinc-850">Existing Service Menu Inventory</h4>
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                {services.map((s) => (
                  <div key={s.id} className="bg-white border border-zinc-100 rounded-xl p-3 flex justify-between items-center shadow-sm">
                    <div className="flex gap-3 items-center min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0">
                        <img src={s.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h6 className="font-bold text-xs truncate">{s.name}</h6>
                        <p className="text-[10px] text-zinc-500">{s.category} • {s.duration}</p>
                        <p className="text-natural-gold text-[11px] font-bold mt-0.5">₹{s.discountPrice} <span className="text-gray-400 font-normal line-through text-[9px]">₹{s.originalPrice}</span></p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteService(s.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Promo Coupons View */}
        {adminTab === "offers" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Create Offer Form (WRITE) */}
            <form onSubmit={handleCreateOffer} className="lg:col-span-5 bg-zinc-50/50 p-5 rounded-2xl border border-gray-200/60 space-y-4">
              <h4 className="font-serif text-base font-semibold text-zinc-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-500" />
                Add Discount Voucher
              </h4>

              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-zinc-600">Promo Label (Campaign Title)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. monsoon breeze sale"
                  value={newOfferTitle}
                  onChange={(e) => setNewOfferTitle(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-zinc-600">Coupon Promo Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RAIN30, MONSOONGLOW"
                  value={newOfferCode}
                  onChange={(e) => setNewOfferCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2.5 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-600">Voucher Type</label>
                  <select
                    value={newOfferType}
                    onChange={(e: any) => setNewOfferType(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Rate (₹)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-zinc-600">Voucher Value</label>
                  <input
                    type="number"
                    required
                    value={newOfferValue}
                    onChange={(e) => setNewOfferValue(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-zinc-800 hover:bg-zinc-900 text-white font-bold tracking-widest text-[11px] uppercase py-3 rounded-lg shadow cursor-pointer"
              >
                Publish Coupon Code
              </button>
            </form>

            {/* Read/Delete Offers List (READ & DELETE) */}
            <div className="lg:col-span-7 space-y-4">
              <h4 className="font-serif text-base font-semibold text-zinc-850">Live Promotional Vouchers</h4>
              <div className="space-y-3">
                {offers.map((of) => (
                  <div key={of.id} className="border border-dashed border-amber-300 rounded-2xl p-4 flex justify-between items-center bg-amber-50/10">
                    <div>
                      <h5 className="font-bold text-xs">{of.title}</h5>
                      <p className="text-[10px] text-zinc-500 mt-1">{of.description}</p>
                      <code className="text-xs bg-amber-100 px-2 py-0.5 mt-2 inline-block font-mono font-bold rounded text-amber-900">
                        {of.code}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteOffer(of.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users view */}
        {adminTab === "users" && (
          <div className="space-y-6">
            <h4 className="font-serif text-lg text-zinc-850 font-medium">Registered Lounge Client Directory</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 uppercase text-zinc-500 font-bold">
                    <th className="p-3">Ref Client UID</th>
                    <th className="p-3">Full client Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Phone Line</th>
                    <th className="p-3">Loyalty points</th>
                    <th className="p-3">Country Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-zinc-50/50">
                      <td className="p-3 font-mono font-bold text-slate-550">{u.uid.slice(0, 8)}...</td>
                      <td className="p-3 font-semibold text-zinc-900">{u.fullName}</td>
                      <td className="p-3 text-zinc-500">{u.email}</td>
                      <td className="p-3 font-mono">{u.phoneNumber}</td>
                      <td className="p-3">
                        <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                          {u.loyaltyPoints} pts
                        </span>
                      </td>
                      <td className="p-3 text-zinc-500">{u.country}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-6 text-zinc-400">No client accounts created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
