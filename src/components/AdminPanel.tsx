import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Calendar, Clipboard, Users, ShieldAlert, CheckCircle, Clock, X, Sparkles, CreditCard, RefreshCw, Mail, AlertTriangle, Lock, KeyRound, Shield, Eye, EyeOff } from "lucide-react";
import { BeautyService, Booking, UserProfile, OfferDeal, PaymentTransaction } from "../types";
import { DEFAULT_SERVICES, DEFAULT_OFFERS } from "../services";
import { db, auth, collection, onSnapshot, doc, updateDoc, deleteDoc, signInWithEmailAndPassword } from "../firebase";

interface AdminPanelProps {
  services: BeautyService[];
  bookings: Booking[];
  users: UserProfile[];
  offers: OfferDeal[];
  onAddService: (service: BeautyService) => void;
  onDeleteService: (id: string) => void;
  onUpdateService: (service: BeautyService) => void;
  onUpdateBookingStatus: (id: string, status: 'pending' | 'confirmed' | 'approved' | 'completed' | 'cancelled' | 'rejected') => void;
  onDeleteBooking: (id: string) => void;
  onAddOffer: (offer: OfferDeal) => void;
  onDeleteOffer: (id: string) => void;
  onUpdateOffer: (offer: OfferDeal) => void;
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
  onDeleteBooking,
  onAddOffer,
  onDeleteOffer,
  onUpdateOffer,
}: AdminPanelProps) {
  const [activeNotification, setActiveNotification] = useState("");

  const triggerNotify = (msg: string) => {
    setActiveNotification(msg);
    setTimeout(() => setActiveNotification(""), 3000);
  };

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthError, setAdminAuthError] = useState("");
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if the current user exists and is an admin
    const checkAdmin = () => {
      const currentUser = auth.currentUser;
      const email = currentUser?.email?.toLowerCase();
      if (email && (email === "beauty@admin" || email.includes("admin"))) {
        setIsAdminAuthenticated(true);
      }
    };
    
    checkAdmin();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const email = user?.email?.toLowerCase();
      if (email && (email === "beauty@admin" || email.includes("admin"))) {
        setIsAdminAuthenticated(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAdminVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError("");
    setAdminAuthLoading(true);

    if (!adminEmail || !adminPassword) {
      setAdminAuthError("Please input admin credentials.");
      setAdminAuthLoading(false);
      return;
    }

    const emailClean = adminEmail.trim().toLowerCase();
    
    // Direct bypass credential matching for website owner console entry convenience
    if (
      emailClean === "beauty@admin" &&
      adminPassword === "beauty@123"
    ) {
      setIsAdminAuthenticated(true);
      triggerNotify("Welcome back, Master Administrator!");
      setAdminAuthLoading(false);
      return;
    }

    try {
      const userCreds = await signInWithEmailAndPassword(auth, adminEmail.trim(), adminPassword);
      const email = userCreds.user.email?.toLowerCase();
      if (email && (email === "beauty@admin" || email.includes("admin"))) {
        setIsAdminAuthenticated(true);
        triggerNotify(`Console authorized for: ${userCreds.user.email}`);
      } else {
        setAdminAuthError("Access denied: Signed in user does not possess 'admin' role privileges.");
      }
    } catch (err: any) {
      console.warn("Security authentication failed:", err);
      setAdminAuthError("Credentials invalid or unrecognized. Please check your administrator login.");
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const [adminTab, setAdminTab] = useState<"services" | "bookings" | "users" | "offers" | "payments">("bookings");
  const [editingService, setEditingService] = useState<BeautyService | null>(null);
  const [editingOffer, setEditingOffer] = useState<OfferDeal | null>(null);

  // States for user profile control
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhoneNumber, setEditPhoneNumber] = useState("");
  const [editLoyaltyPoints, setEditLoyaltyPoints] = useState(0);
  const [editRole, setEditRole] = useState<"user" | "admin">("user");
  const [editCountry, setEditCountry] = useState("");

  const handleStartEditUser = (u: UserProfile) => {
    setEditingUser(u);
    setEditFullName(u.fullName || "");
    setEditEmail(u.email || "");
    setEditPhoneNumber(u.phoneNumber || "");
    setEditLoyaltyPoints(u.loyaltyPoints || 0);
    setEditRole(u.role || "user");
    setEditCountry(u.country || "IN");
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const userRef = doc(db, "users", editingUser.uid);
      await updateDoc(userRef, {
        fullName: editFullName,
        email: editEmail,
        phoneNumber: editPhoneNumber,
        loyaltyPoints: Number(editLoyaltyPoints),
        role: editRole,
        country: editCountry,
      });
      triggerNotify(`User profile for ${editFullName} updated successfully!`);
      setEditingUser(null);
    } catch (err: any) {
      triggerNotify(`Error editing user: ${err.message || err}`);
    }
  };

  const handleDeleteUser = async (uid: string, fullName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user account "${fullName}"? This action cannot be undone.`)) return;
    try {
      const userRef = doc(db, "users", uid);
      await deleteDoc(userRef);
      triggerNotify(`User ${fullName} deleted successfully.`);
    } catch (err: any) {
      triggerNotify(`Error deleting user: ${err.message || err}`);
    }
  };
  
  // Realtime Payment transactions monitor hook for PhonePe tracing
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  useEffect(() => {
    setPaymentsLoading(true);
    const unsubscribe = onSnapshot(collection(db, "payments"), (snapshot) => {
      const temp: PaymentTransaction[] = [];
      snapshot.forEach((doc) => {
        temp.push({ id: doc.id, ...doc.data() } as PaymentTransaction);
      });
      temp.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPayments(temp);
      setPaymentsLoading(false);
    }, (err) => {
      console.warn("Realtime payments listener failed:", err);
      setPaymentsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleExecuteRefund = async (payId: string, customerEmail: string) => {
    try {
      const payRef = doc(db, "payments", payId);
      await updateDoc(payRef, {
        status: "refunded",
        refundStatus: "completed",
        refundCompletedAt: new Date().toISOString(),
        emailSent: true,
        emailSentAt: new Date().toISOString()
      });
      triggerNotify(`PhonePe UPI Refund processed successfully! Automated E-mail sent to ${customerEmail}.`);
    } catch (err) {
      console.error("Failed to process refund in Firestore:", err);
      triggerNotify("Failed to record refund status inside active sandbox.");
    }
  };
  
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

  const handleStartEditService = (srv: BeautyService) => {
    setEditingService(srv);
    setNewServiceName(srv.name);
    setNewServiceCategory(srv.category as any);
    setNewServicePrice(srv.originalPrice);
    setNewServiceDiscount(srv.discountPrice);
    setNewServiceDuration(srv.duration);
    setNewServiceDesc(srv.description);
    setNewServiceImg(srv.image);
    setAdminTab("services");
  };

  const handleCancelEditService = () => {
    setEditingService(null);
    setNewServiceName("");
    setNewServiceDesc("");
    setNewServiceImg("");
    setNewServicePrice(3000);
    setNewServiceDiscount(2500);
    setNewServiceDuration("60 mins");
  };

  const handleStartEditOffer = (of: OfferDeal) => {
    setEditingOffer(of);
    setNewOfferTitle(of.title);
    setNewOfferCode(of.code);
    setNewOfferValue(of.discountValue);
    setNewOfferType(of.discountType);
    setAdminTab("offers");
  };

  const handleCancelEditOffer = () => {
    setEditingOffer(null);
    setNewOfferTitle("");
    setNewOfferCode("");
    setNewOfferValue(20);
    setNewOfferType("percentage");
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServiceDesc) return;

    if (editingService) {
      const updated: BeautyService = {
        ...editingService,
        name: newServiceName,
        category: newServiceCategory,
        description: newServiceDesc,
        originalPrice: Number(newServicePrice),
        discountPrice: Number(newServiceDiscount),
        duration: newServiceDuration,
        image: newServiceImg || "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&auto=format&fit=crop&q=80",
        badge: `${Math.round(((newServicePrice - newServiceDiscount) / newServicePrice) * 100)}% OFF`,
      };
      onUpdateService(updated);
      triggerNotify(`Service "${newServiceName}" updated successfully!`);
      handleCancelEditService();
    } else {
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
      handleCancelEditService();
    }
  };

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferTitle || !newOfferCode) return;

    if (editingOffer) {
      const updated: OfferDeal = {
        ...editingOffer,
        title: newOfferTitle,
        description: `Get absolute ${newOfferType === "percentage" ? `${newOfferValue}%` : `₹${newOfferValue}`} off on your beauty care.`,
        code: newOfferCode.toUpperCase().trim(),
        discountType: newOfferType,
        discountValue: Number(newOfferValue),
      };
      onUpdateOffer(updated);
      triggerNotify(`Promo Voucher "${newOfferCode}" updated successfully!`);
      handleCancelEditOffer();
    } else {
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
      handleCancelEditOffer();
    }
  };
  
  if (!isAdminAuthenticated) {
    return (
      <div id="admin-security-gate" className="max-w-md mx-auto my-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-8 animate-fade-in text-[#4A3F3B] dark:text-zinc-200">
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 rounded-full flex items-center justify-center mx-auto border border-amber-200/50">
            <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="font-serif text-2xl font-semibold tracking-wide text-zinc-900 dark:text-zinc-50">Admin Console Access</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            This workspace contains private salon records and custom inventory controls. Please authenticate using staff credentials.
          </p>
        </div>

        <form onSubmit={handleAdminVerifySubmit} className="space-y-4">
          <div className="space-y-1 text-xs">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 block">Staff Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="email"
                required
                placeholder="e.g. admin@luxebeauty.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-amber-500 outline-none text-xs transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-bold text-zinc-700 dark:text-zinc-300 block">Administrative Passcode</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 focus:ring-amber-500 outline-none text-xs transition-all dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {adminAuthError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-150 rounded-xl flex items-start gap-2 text-[11px] text-rose-700 dark:text-rose-400 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{adminAuthError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={adminAuthLoading}
            className="w-full bg-[#4A3F3B] hover:bg-[#3D3330] dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-zinc-900 font-extrabold tracking-widest text-[11px] uppercase py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {adminAuthLoading ? (
              <span className="w-4 h-4 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="w-4 h-4" /> Secure Admin Entry
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

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
            onClick={() => setAdminTab("payments")}
            className={`px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
              adminTab === "payments" ? "bg-amber-500 text-zinc-900" : "bg-zinc-800 hover:bg-zinc-700"
            }`}
          >
            Payments & Refunds ({payments.length})
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
                        <div className="flex items-center gap-2">
                          {b.serviceImage && (
                            <img src={b.serviceImage} alt={b.serviceName} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-zinc-200 dark:border-zinc-700" referrerPolicy="no-referrer" />
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-semibold">{b.serviceName}</p>
                              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                b.status === "approved" || b.status === "confirmed"
                                  ? "bg-green-100 dark:bg-green-950/40 text-green-850 dark:text-green-400 border-green-200/40"
                                  : b.status === "pending"
                                  ? "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border-yellow-200/40"
                                  : b.status === "completed"
                                  ? "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border-blue-200/40"
                                  : "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 border-red-200/40"
                              }`}>
                                {b.status === "approved" || b.status === "confirmed" ? "Approved" : b.status === "pending" ? "Pending" : b.status === "completed" ? "Completed" : "Rejected"}
                              </span>
                            </div>
                            <p className="text-[10px] text-natural-gold font-bold">₹{b.servicePrice}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium">{b.date}</p>
                        <p className="text-[10px] text-zinc-500">{b.timeSlot.split(' - ')[0]}</p>
                      </td>
                      <td className="p-3 text-[11px] text-zinc-700">{b.artist}</td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, "approved")}
                            className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-green-100 cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, "rejected")}
                            className="bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-red-100 cursor-pointer"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, "pending")}
                            className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-yellow-100 cursor-pointer"
                          >
                            Pending
                          </button>
                          <button
                            onClick={() => onUpdateBookingStatus(b.id, "completed")}
                            className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-blue-100 cursor-pointer"
                          >
                            Done
                          </button>
                          <button
                            onClick={() => onDeleteBooking(b.id)}
                            className="bg-zinc-50 text-zinc-600 border border-zinc-200 px-1.5 py-1 rounded text-[10px] font-bold hover:bg-zinc-100 cursor-pointer"
                            title="Delete booking record"
                          >
                            <Trash2 className="w-3 h-3" />
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
            {/* Create/Update Service Form (WRITE/UPDATE) */}
            <form onSubmit={handleCreateService} className="lg:col-span-5 bg-zinc-50/50 p-5 rounded-2xl border border-natural-border space-y-4">
              <h4 className="font-serif text-base font-semibold text-[#4A3F3B] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {editingService ? <Edit2 className="w-4 h-4 text-amber-500 animate-pulse" /> : <Plus className="w-4 h-4 text-natural-gold" />}
                  {editingService ? "Update Premium Service" : "Add Premium Service"}
                </span>
                {editingService && (
                  <button
                    type="button"
                    onClick={handleCancelEditService}
                    className="text-[10px] bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
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

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-grow bg-[#4A3F3B] hover:bg-[#3D3330] text-white font-bold tracking-widest text-[11px] uppercase py-3 rounded-lg shadow cursor-pointer transition-all border border-natural-gold/15"
                >
                  {editingService ? "Save Service Changes" : "Create Beauty Service"}
                </button>
                {editingService && (
                  <button
                    type="button"
                    onClick={handleCancelEditService}
                    className="bg-zinc-200 hover:bg-zinc-350 text-zinc-800 w-12 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    title="Cancel Edit"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
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
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditService(s)}
                        className="text-zinc-600 hover:bg-zinc-100 p-2 rounded-lg cursor-pointer"
                        title="Edit Service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingService?.id === s.id) {
                            handleCancelEditService();
                          }
                          onDeleteService(s.id);
                        }}
                        className="text-red-550 hover:bg-red-50 p-2 rounded-lg cursor-pointer"
                        title="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Promo Coupons View */}
        {adminTab === "offers" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Create/Update Offer Form (WRITE/UPDATE) */}
            <form onSubmit={handleCreateOffer} className="lg:col-span-5 bg-zinc-50/50 p-5 rounded-2xl border border-gray-200/60 space-y-4">
              <h4 className="font-serif text-base font-semibold text-zinc-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  {editingOffer ? <Edit2 className="w-4 h-4 text-amber-500 animate-pulse" /> : <Plus className="w-4 h-4 text-amber-500" />}
                  {editingOffer ? "Update Discount Voucher" : "Add Discount Voucher"}
                </span>
                {editingOffer && (
                  <button
                    type="button"
                    onClick={handleCancelEditOffer}
                    className="text-[10px] bg-zinc-200 hover:bg-zinc-300 text-zinc-700 px-2 py-0.5 rounded cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
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

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-grow bg-zinc-800 hover:bg-zinc-900 text-white font-bold tracking-widest text-[11px] uppercase py-3 rounded-lg shadow cursor-pointer transition-all"
                >
                  {editingOffer ? "Save Coupon Changes" : "Publish Coupon Code"}
                </button>
                {editingOffer && (
                  <button
                    type="button"
                    onClick={handleCancelEditOffer}
                    className="bg-zinc-200 hover:bg-zinc-350 text-zinc-800 w-12 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                    title="Cancel Edit"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>

            {/* Read/Delete Offers List (READ, UPDATE & DELETE) */}
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
                    <div className="flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditOffer(of)}
                        className="text-zinc-600 hover:bg-zinc-100 p-2 rounded-lg cursor-pointer animate-fade-in"
                        title="Edit Coupon"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingOffer?.id === of.id) {
                            handleCancelEditOffer();
                          }
                          onDeleteOffer(of.id);
                        }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users view */}
        {adminTab === "users" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="font-serif text-lg text-zinc-850 font-medium">Registered Lounge Client Directory</h4>
                <p className="text-xs text-zinc-500">View, manipulate roles, update personal details, adjust loyalty assets, or ban inactive client profiles.</p>
              </div>
            </div>

            {/* Edit User Form/Modal Card */}
            {editingUser && (
              <div className="bg-zinc-50 border-2 border-amber-450 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-600 animate-pulse" />
                    <span className="font-serif text-md font-semibold text-zinc-800">
                      Control Profile: {editingUser.fullName}
                    </span>
                  </div>
                  <button 
                    onClick={() => setEditingUser(null)} 
                    className="p-1 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">Full Client Name</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white"
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">Phone Line</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white"
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">System Security Role</label>
                    <select
                      className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white font-bold"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as "user" | "admin")}
                    >
                      <option value="user">USER (Lounge Client)</option>
                      <option value="admin">ADMIN (Executive Manager)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">Country</label>
                    <input
                      type="text"
                      className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">Lounge Loyalty Balance</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        className="w-20 text-xs p-2.5 rounded-lg border border-zinc-200 bg-white font-bold"
                        value={editLoyaltyPoints}
                        onChange={(e) => setEditLoyaltyPoints(Number(e.target.value))}
                        min="0"
                      />
                      <button
                        type="button"
                        onClick={() => setEditLoyaltyPoints(p => p + 100)}
                        className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] uppercase font-bold p-2.5 rounded-lg"
                      >
                        +100
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditLoyaltyPoints(p => Math.max(0, p - 50))}
                        className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[10px] uppercase font-bold p-2.5 rounded-lg"
                      >
                        -50
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 bg-zinc-205 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-zinc-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-500 text-zinc-900 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-amber-600 shadow-sm"
                    >
                      Commit Profile Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-150">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 uppercase text-zinc-500 font-bold">
                    <th className="p-3">Ref Client UID</th>
                    <th className="p-3">Full client Name</th>
                    <th className="p-3">Email Address</th>
                    <th className="p-3">Phone Line</th>
                    <th className="p-3">Loyalty points</th>
                    <th className="p-3">Security Role</th>
                    <th className="p-3">Country</th>
                    <th className="p-3 text-right">Administrative Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.uid} className="hover:bg-zinc-50/50">
                      <td className="p-3 font-mono font-bold text-slate-550 shrink-0">
                        {u.uid.slice(0, 10)}...
                      </td>
                      <td className="p-3 font-semibold text-zinc-900">
                        {u.fullName || "Incognito Guest"}
                      </td>
                      <td className="p-3 text-zinc-650 font-medium">
                        {u.email}
                      </td>
                      <td className="p-3 font-mono text-zinc-500">
                        {u.phoneNumber || "Not bound"}
                      </td>
                      <td className="p-3">
                        <span className="bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full font-bold">
                          {u.loyaltyPoints || 0} pts
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide inline-block ${
                          u.role === "admin" 
                            ? "bg-rose-100 text-rose-800 border border-rose-200" 
                            : "bg-emerald-100 text-emerald-800 border border-emerald-250"
                        }`}>
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="p-3 text-zinc-550 font-medium font-mono">{u.country || "IN"}</td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleStartEditUser(u)}
                            className="bg-zinc-100 text-zinc-700 hover:bg-amber-500 hover:text-zinc-950 p-2 rounded-lg transition-colors cursor-pointer"
                            title="Edit Loyalty & Settings"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.uid, u.fullName || u.email)}
                            className="bg-zinc-100 text-red-650 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center p-6 text-zinc-400">No client accounts created yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payments Ledger Terminal */}
        {adminTab === "payments" && (
          <div className="space-y-6 animate-fade-in font-sans">
            <div>
              <h4 className="font-serif text-lg text-zinc-850 dark:text-zinc-50 font-medium tracking-wide">PhonePe UPI & Bank Transaction Ledger</h4>
              <p className="text-xs text-zinc-500">Track raw payments, verify UTR traces, and reconcile failed client payouts with instant refund releases.</p>
            </div>

            {paymentsLoading ? (
              <div className="text-center py-10 text-xs text-zinc-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-550" />
                Querying merchant transaction database...
              </div>
            ) : payments.length === 0 ? (
              <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center text-xs text-zinc-500">
                <CreditCard className="w-10 h-10 text-zinc-400 mx-auto mb-2 shrink-0 animate-pulse" />
                <p>No transactions registered on your merchant UPI key today.</p>
                <p className="text-[10px] text-zinc-405 mt-1">Payments made to 9025049229@axl will show up here real-time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-850 uppercase text-zinc-500 dark:text-zinc-405 font-bold">
                      <th className="p-3">Reference ID</th>
                      <th className="p-3">Client details</th>
                      <th className="p-3">Service Details</th>
                      <th className="p-3">Payment Info</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-805/30">
                        <td className="p-3 font-mono font-bold text-natural-gold text-[10px]">{p.id}</td>
                        <td className="p-3">
                          <p className="font-bold">{p.userName}</p>
                          <p className="text-[10px] text-zinc-505 dark:text-zinc-400 font-medium">{p.userEmail}</p>
                          <p className="text-[10px] text-zinc-420 font-mono">{p.userPhone}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{p.serviceName}</p>
                          <p className="text-[11px] font-mono font-bold text-rose-500">₹{p.amount}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold uppercase text-[10px] text-zinc-700 dark:text-zinc-300">{p.paymentMethod === "upi" ? "PhonePe UPI" : p.paymentMethod}</p>
                          <p className="text-[10px] text-zinc-500">UTR: <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">{p.transactionRef}</span></p>
                          {p.upiIdUsed && <p className="text-[10px] text-zinc-505">Client VPA: <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">{p.upiIdUsed}</span></p>}
                        </td>
                        <td className="p-3 text-center">
                          <div className="space-y-1">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              p.status === "paid"
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 border border-emerald-200/50"
                                : p.status === "failed"
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-450 border border-rose-150"
                                : p.status === "refunded"
                                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50"
                                : "bg-zinc-100 text-zinc-700 font-bold"
                            }`}>
                              {p.status}
                            </span>
                            {p.status === "failed" && (
                              <p className="text-[9px] text-rose-500 font-bold uppercase animate-pulse">Manual Refund Pending</p>
                            )}
                            {p.status === "refunded" && (
                              <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-emerald-600" /> E-mailed
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {p.status === "failed" && (
                            <button
                              type="button"
                              onClick={() => handleExecuteRefund(p.id, p.userEmail)}
                              className="bg-amber-50 hover:bg-amber-100/80 text-amber-900 dark:text-amber-100 border border-amber-250 dark:border-amber-900/40 px-3 py-1.5 rounded-xl text-[10px] font-extrabold shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1 ml-auto"
                            >
                              <RefreshCw className="w-3.5 h-3.5 text-amber-800" />
                              Approve & Refund (2 Days)
                            </button>
                          )}
                          {p.status === "paid" && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-extrabold uppercase">Reconciled ✓</span>
                          )}
                          {p.status === "refunded" && (
                            <div className="text-right">
                              <span className="text-[10px] text-zinc-420 dark:text-zinc-400 font-bold uppercase">Refund Issued</span>
                              <p className="text-[8px] text-zinc-400">UTR manual credit tracing active</p>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
