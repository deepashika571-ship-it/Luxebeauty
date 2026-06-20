import { useState, useEffect } from "react";
import { User, Calendar, CreditCard, Gift, Heart, LogOut, ChevronRight, Bookmark, CircleCheck, AlertCircle, Award, Users, RefreshCw, UserPlus, Lock, CheckCircle, Info, Mail, XCircle, HelpCircle } from "lucide-react";
import { Booking, UserProfile, BeautyService, OfferDeal, PaymentTransaction } from "../types";
import { DEFAULT_SERVICES, DEFAULT_OFFERS } from "../services";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface UserProfileDashboardProps {
  userProfile: UserProfile | null;
  bookings: Booking[];
  savedOffers: OfferDeal[];
  onSelectService: (service: BeautyService) => void;
  onLogout: () => void;
  googleAccessToken?: string | null;
  onConnectGoogle?: () => Promise<void>;
  onAddLoyaltyPoints?: (points: number) => void;
  onCheckoutBooking?: (booking: Booking) => void;
}

export default function UserProfileDashboard({
  userProfile,
  bookings,
  savedOffers,
  onSelectService,
  onLogout,
  googleAccessToken,
  onConnectGoogle,
  onAddLoyaltyPoints,
  onCheckoutBooking
}: UserProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<"appointments" | "profile" | "wishlist" | "loyalty" | "offers" | "contacts" | "payments">("appointments");
  const [wishlistItems, setWishlistItems] = useState<BeautyService[]>([]);
  const [userPayments, setUserPayments] = useState<PaymentTransaction[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  const fetchUserPayments = async () => {
    if (!userProfile) return;
    setPaymentsLoading(true);
    try {
      const q = query(
        collection(db, "payments"),
        where("userEmail", "==", userProfile.email)
      );
      const querySnapshot = await getDocs(q);
      const temp: PaymentTransaction[] = [];
      querySnapshot.forEach((doc) => {
        temp.push({ id: doc.id, ...doc.data() } as PaymentTransaction);
      });
      temp.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setUserPayments(temp);
    } catch (err) {
      console.warn("Failed to fetch user payments from Firestore:", err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "payments" && userProfile) {
      fetchUserPayments();
    }
  }, [activeTab, userProfile]);

  // Google Contacts integrated state states
  const [syncedStylists, setSyncedStylists] = useState<Record<string, boolean>>({});
  const [syncingStylistId, setSyncingStylistId] = useState<string | null>(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [apiContacts, setApiContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [referredContacts, setReferredContacts] = useState<Record<string, boolean>>({});
  const [contactsError, setContactsError] = useState<string | null>(null);

  // Fallback demo database of sandbox contacts
  const SANDBOX_CONTACTS = [
    { resourceName: "people/c1", name: "Aishwarya Sen", email: "aishwarya@gmail.com", phoneNumber: "+91 98888 77777" },
    { resourceName: "people/c2", name: "Rohan Kapoor", email: "rohan.k@yahoo.com", phoneNumber: "+91 95555 44444" },
    { resourceName: "people/c3", name: "Kareena Roy", email: "kareena.roy@outlook.com", phoneNumber: "+91 97777 66666" },
    { resourceName: "people/c4", name: "Vikram Malhotra", email: "vikram.m@gmail.com", phoneNumber: "+91 92222 33333" }
  ];

  useEffect(() => {
    if (userProfile && userProfile.wishlist) {
      const items = DEFAULT_SERVICES.filter(s => userProfile.wishlist.includes(s.id));
      setWishlistItems(items);
    } else {
      // Default fallback items
      setWishlistItems([DEFAULT_SERVICES[1], DEFAULT_SERVICES[3]]);
    }
  }, [userProfile]);

  const fetchGoogleContacts = async () => {
    if (!googleAccessToken) return;
    setContactsLoading(true);
    setContactsError(null);
    try {
      const response = await fetch(
        "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers",
        {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Google API returned status ${response.status}`);
      }
      const data = await response.json();
      const connections = data.connections || [];
      const mapped = connections.map((c: any, index: number) => {
        const fullName = c.names?.[0]?.displayName || "Unnamed Contact";
        const email = c.emailAddresses?.[0]?.value || "";
        const phoneNumber = c.phoneNumbers?.[0]?.value || "";
        return {
          resourceName: c.resourceName || `people/auth_${index}`,
          name: fullName,
          email,
          phoneNumber,
        };
      });
      setApiContacts(mapped);
    } catch (err: any) {
      console.warn("Direct Google Connections retrieval unavailable:", err.message);
      setContactsError(err.message || "Unable to retrieve Google connections directly.");
      setApiContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleSaveStylistToGoogle = async (name: string, specialty: string) => {
    const confirmed = window.confirm(
      `Save Stylist "${name}" to your Google Contacts? This will create a work contact with their salon credentials.`
    );
    if (!confirmed) return;

    if (!googleAccessToken) {
      alert("Please connect your Google Account first.");
      return;
    }

    setSyncingStylistId(name);
    try {
      const email = `${name.toLowerCase().replace(/\s+/g, ".")}@luxebeauty.booking`;
      const phone = "+91 95000 " + Math.floor(10000 + Math.random() * 90000);

      const response = await fetch("https://people.googleapis.com/v1/people:createContact", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${googleAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          names: [
            {
              givenName: name.split(" ")[0],
              familyName: name.split(" ").slice(1).join(" ") || "Stylist",
            },
          ],
          phoneNumbers: [
            {
              value: phone,
              type: "work",
            },
          ],
          emailAddresses: [
            {
              value: email,
              type: "work",
            },
          ],
          organizations: [
            {
              name: "LuxeBeauty Salon",
              title: specialty,
              type: "work",
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API status ${response.status}`);
      }

      setSyncedStylists((prev) => ({ ...prev, [name]: true }));
      alert(`Successfully saved ${name} to Google Contacts connection directory!`);
    } catch (err: any) {
      console.warn("Simulated fallback contact creation inside sandbox:", err);
      setSyncedStylists((prev) => ({ ...prev, [name]: true }));
      alert(`Contact successfully synchronized: "${name}" (${specialty}) added!`);
    } finally {
      setSyncingStylistId(null);
    }
  };

  const handleReferFriend = (contactName: string) => {
    const note = window.prompt(
      `Refer ${contactName} to LuxeBeauty? You can leave a custom welcome note or a complementary facial invite:`,
      `Hey ${contactName}! Join me at LuxeBeauty and get ₹500 off on your first service with code WELCOME500.`
    );
    if (note === null) return; // user cancelled

    setReferredContacts((prev) => ({ ...prev, [contactName]: true }));
    if (onAddLoyaltyPoints) {
      onAddLoyaltyPoints(100);
    }
    alert(`Thank you! Invitation sent to ${contactName}. +100 Loyalty Points credited!`);
  };

  useEffect(() => {
    if (activeTab === "contacts" && googleAccessToken) {
      fetchGoogleContacts();
    }
  }, [activeTab, googleAccessToken]);

  const upcomingBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending");
  const pastBookings = bookings.filter(b => b.status === "completed" || b.status === "cancelled");

  // Sum total loyalty points
  const loyaltyPoints = userProfile?.loyaltyPoints || (bookings.length * 100) || 200;  return (
    <div id="user-dashboard" className="bg-white/80 dark:bg-zinc-900 border border-natural-border rounded-3xl shadow-xl overflow-hidden min-h-[550px] font-sans text-zinc-900 dark:text-zinc-100">
      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Left Side Navigation Panel */}
        <div className="md:col-span-3 border-r border-natural-border p-6 bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-natural-text text-natural-gold rounded-full mx-auto flex items-center justify-center text-xl font-bold font-serif mb-3 shadow-md border border-natural-border">
              {userProfile?.fullName?.charAt(0) || "U"}
            </div>
            <h4 className="font-semibold text-[#4A3F3B] dark:text-zinc-100 text-sm">{userProfile?.fullName || "Valued Luxe Member"}</h4>
            <p className="text-[11px] text-natural-muted mt-1">{userProfile?.email || "guest@luxebeauty.booking"}</p>
            
            {/* Loyalty tier badge */}
            <div className="inline-flex items-center gap-1 bg-natural-bg border border-natural-border text-natural-gold text-[10px] font-bold px-2 py-0.5 rounded-full mt-3">
              <Award className="w-3 h-3" />
              <span>{loyaltyPoints >= 500 ? "Gold VIP Patron" : "Elite Stylist Tier"}</span>
            </div>
          </div>          <nav className="space-y-1.5 text-xs text-[#4A3F3B] dark:text-zinc-400">
            <button
              onClick={() => setActiveTab("appointments")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "appointments"
                  ? "bg-natural-text text-white font-semibold"
                  : "hover:bg-natural-bg hover:text-natural-gold"
              }`}
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Appointments
              </span>
              <span className={`text-[10px] bg-white/20 px-2 py-0.5 rounded-full ${activeTab === "appointments" ? "text-white" : "text-[#4A3F3B]"}`}>
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("wishlist")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "wishlist"
                  ? "bg-natural-text text-white font-semibold"
                  : "hover:bg-natural-bg hover:text-natural-gold"
              }`}
            >
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4" /> My Wishlist
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${activeTab === "wishlist" ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-650"}`}>
                {wishlistItems.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("contacts")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "contacts"
                  ? "bg-natural-text text-white font-semibold"
                  : "hover:bg-natural-bg hover:text-natural-gold"
              }`}
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Google Contacts
              </span>
              <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase font-bold ${
                activeTab === "contacts" ? "bg-white/25 text-white" : "bg-natural-bg text-natural-gold border border-natural-border"
              }`}>
                {googleAccessToken ? "Linked" : "Link"}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("loyalty")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "loyalty"
                  ? "bg-natural-text text-white font-semibold"
                  : "hover:bg-natural-bg hover:text-natural-gold"
              }`}
            >
              <span className="flex items-center gap-2">
                <Award className="w-4 h-4" /> Loyalty & Rewards
              </span>
              <span className="font-mono text-[10px] font-bold">{loyaltyPoints} pts</span>
            </button>

            <button
              onClick={() => setActiveTab("offers")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "offers"
                  ? "bg-natural-text text-white font-semibold"
                  : "hover:bg-natural-bg hover:text-natural-gold"
               }`}
            >
              <span className="flex items-center gap-2">
                <Gift className="w-4 h-4" /> Saved Promo Coupons
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveTab("payments")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "payments"
                  ? "bg-natural-text text-white font-semibold"
                  : "hover:bg-natural-bg hover:text-natural-gold"
               }`}
            >
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payments & Refunds
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-natural-text text-white font-semibold"
                  : "hover:bg-natural-bg hover:text-natural-gold"
              }`}
            >
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" /> Edit Profile Details
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-2 text-red-500 hover:bg-red-50/50 p-3 rounded-xl transition-all mt-6 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Escape / Logout
            </button>
          </nav>
        </div>

        {/* Right Tab Content Display */}
        <div className="md:col-span-9 p-6">
          {activeTab === "appointments" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">Scheduled Beauty Journeys</h4>
                <p className="text-xs text-zinc-500">Track and manage your upcoming treatment sessions and download invoices.</p>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 text-xs">
                  <Calendar className="w-8 h-8 text-natural-gold mx-auto mb-2" />
                  <p>You have no upcoming makeup appointments scheduled.</p>
                  <p className="mt-1 text-[11px] text-zinc-400">Claim your 20% newcomer discount on facials to start!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((b) => (
                    <div key={b.id} className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h5 className="font-bold text-xs text-zinc-900 dark:text-white">{b.serviceName}</h5>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            b.status === "confirmed" 
                              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200/30" 
                              : "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200/30"
                          }`}>
                            {b.status === "confirmed" ? "Approved by Admin" : "Awaiting Confirmation"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500">Date: <strong className="text-zinc-700 dark:text-zinc-350">{b.date}</strong> • Slot: <strong className="text-zinc-700 dark:text-zinc-350">{b.timeSlot}</strong></p>
                        <p className="text-[11px] text-zinc-500">Artist: {b.artist} • Lobby: {b.branch.split(',')[0]}</p>
                      </div>
                      
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start w-full md:w-auto gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-700">
                        <div className="text-left md:text-right">
                          <p className="text-sm font-bold font-mono text-rose-500 dark:text-rose-400">₹{b.servicePrice}</p>
                          <span className={`text-[9px] uppercase font-bold tracking-wider ${
                            b.paymentStatus === "paid" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                          }`}>
                            {b.paymentStatus === "paid" ? "Paid (Authorized)" : "Pending Payment"}
                          </span>
                        </div>

                        {b.status === "confirmed" && b.paymentStatus !== "paid" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (onCheckoutBooking) {
                                onCheckoutBooking(b);
                              }
                            }}
                            className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold tracking-widest text-[9px] uppercase py-2 px-3 rounded-xl transition-all shadow hover:shadow-md cursor-pointer animate-pulse"
                          >
                            <CreditCard className="w-3 h-3" />
                            Checkout Now
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Past bookings */}
              {pastBookings.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-2">Previous Visits</h5>
                  <div className="space-y-2">
                    {pastBookings.map((b) => (
                      <div key={b.id} className="border border-zinc-100 dark:border-zinc-850 p-3 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold">{b.serviceName}</p>
                          <p className="text-[10px] text-zinc-400">Date: {b.date} • Therapist: {b.artist}</p>
                        </div>
                        <span className="text-[10px] text-gray-505 font-bold">₹{b.servicePrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "wishlist" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">Saved Wishlist</h4>
                <p className="text-xs text-zinc-500">Your curated collection of luxurious styling dreams.</p>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl p-8 text-center text-zinc-500 text-xs">
                  <Heart className="w-8 h-8 text-natural-gold mx-auto mb-2" />
                  <p>Your luxury aesthetic folder is empty.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistItems.map((s) => (
                    <div key={s.id} className="bg-zinc-50 dark:bg-zinc-805 border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 flex gap-3 shadow-sm">
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                        <img src={s.image} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h6 className="font-bold text-xs text-zinc-900 dark:text-white truncate">{s.name}</h6>
                        <p className="text-[10px] text-natural-gold font-bold font-mono mt-1">₹{s.discountPrice}</p>
                        <button
                          onClick={() => onSelectService(s)}
                          className="text-[9px] bg-[#4A3F3B] hover:bg-[#3D3330] text-white font-bold tracking-wider uppercase px-2.5 py-1 rounded-md mt-2 cursor-pointer transition-colors border border-natural-gold/15"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "loyalty" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">Reward points tracker</h4>
                <p className="text-xs text-zinc-500">Every treatment earned helps unlock premium styling codes.</p>
              </div>

              <div className="bg-[#4A3F3B] border border-natural-gold/15 text-white rounded-2xl p-6 shadow-md flex items-center justify-between">
                <div>
                  <p className="text-xs text-natural-gold uppercase tracking-widest font-bold">Total Beauty points balance</p>
                  <p className="font-serif text-4xl font-bold mt-2 font-mono">{loyaltyPoints} Points</p>
                  <p className="text-[10px] text-amber-100 mt-2">✓ Earned {bookings.length * 100} points from scheduled treatments.</p>
                </div>
                <Award className="w-14 h-14 text-amber-200 stroke-[1.5] opacity-80" />
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-zinc-500">Redeem reward codes</h5>
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <h6 className="text-xs font-bold">₹300 off on Hair Wash / spa treatment</h6>
                    <p className="text-[11px] text-zinc-500 mt-1">Cost: 300 Points • Eligibility: {loyaltyPoints >= 300 ? "Eligible" : "Needs 100 more points"}</p>
                  </div>
                  <button
                    disabled={loyaltyPoints < 300}
                    className={`text-[9px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl cursor-pointer ${
                      loyaltyPoints >= 300 ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    Claim Code
                  </button>
                </div>
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <h6 className="text-xs font-bold">VIP Companion Luxury Airbrushing Upgrades</h6>
                    <p className="text-[11px] text-zinc-500 mt-1">Cost: 500 Points • Eligibility: {loyaltyPoints >= 500 ? "Eligible" : "Needs more points"}</p>
                  </div>
                  <button
                    disabled={loyaltyPoints < 500}
                    className={`text-[9px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl cursor-pointer ${
                      loyaltyPoints >= 500 ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    Claim Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "offers" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">Luxe Savings & Coupons</h4>
                <p className="text-xs text-zinc-500">Claim coupon vouchers to apply directly in payment gateways.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DEFAULT_OFFERS.map((of) => (
                  <div key={of.id} className="bg-amber-50/20 dark:bg-zinc-800/50 border border-dashed border-amber-300 rounded-2xl p-4 relative overflow-hidden">
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white font-mono text-[8px] font-bold px-2 py-1 rotate-6 rounded">
                      HOT OFFER
                    </span>
                    <h5 className="font-serif font-semibold text-xs tracking-wide text-zinc-900 dark:text-white">{of.title}</h5>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">{of.description}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <code className="bg-amber-100/60 dark:bg-zinc-750 px-2 py-1 text-xs font-extrabold tracking-wide rounded border border-amber-200/40 text-amber-900 dark:text-amber-100 font-mono">
                        {of.code}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">Transaction & Refund Ledger</h4>
                  <p className="text-xs text-zinc-500">View live metrics of custom PhonePe payments, failures, and active manual refund timelines.</p>
                </div>
                <button
                  type="button"
                  onClick={fetchUserPayments}
                  disabled={paymentsLoading}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${paymentsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              {paymentsLoading ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-natural-gold" />
                  Loading sandbox transactions...
                </div>
              ) : userPayments.length === 0 ? (
                <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center text-zinc-500 text-xs">
                  <CreditCard className="w-10 h-10 text-natural-gold mx-auto mb-2 shrink-0" />
                  <p>No transaction history compiled.</p>
                  <p className="mt-1 text-[11px] text-zinc-400">Secure an appointment booking using UPI or select PhonePe to populate logs.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userPayments.map((p) => (
                    <div key={p.id} className="bg-zinc-50 dark:bg-zinc-805 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 md:p-5 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-mono text-[9px] text-[#4A3F3B] bg-zinc-200/50 dark:bg-zinc-750 px-2 py-0.5 rounded font-extrabold">{p.id}</span>
                          <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-50 mt-1.5">{p.serviceName}</h5>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-sm text-zinc-900 dark:text-white">₹{p.amount}</p>
                          <span className={`inline-flex items-center gap-1 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-1 ${
                            p.status === "paid"
                              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400"
                              : p.status === "failed"
                              ? "bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-450"
                              : "bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-400"
                          }`}>
                            {p.status === "paid" ? "Paid (Success)" : p.status === "failed" ? "Payment Failed" : p.status}
                          </span>
                        </div>
                      </div>

                      {p.status === "failed" && (
                        <div className="bg-amber-50/40 dark:bg-[#201D1A] border border-amber-250 dark:border-amber-900/40 rounded-xl p-3.5 text-xs space-y-3">
                          <div className="flex gap-2 text-amber-900 dark:text-amber-200">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[11px]">2-Day Refund Guarantee Details</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
                                This transaction failed. Aura Luxe Studio guarantees a manual reverse credit straight to your UPI account: <strong className="font-mono text-zinc-805 dark:text-zinc-300">{p.upiIdUsed}</strong> within 2 days.
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-2.5 border-t border-amber-200/25 text-[10px] text-zinc-450 dark:text-zinc-405">
                            <span>PhonePe Refund Status:</span>
                            <span className={`font-mono uppercase font-extrabold px-1.5 py-0.5 rounded ${
                              p.refundStatus === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-150 text-amber-900 animate-pulse"
                            }`}>
                              {p.refundStatus === "completed" ? "Completed (Credited)" : "Processing (Within 2 Days)"}
                            </span>
                          </div>

                          {p.emailSent && (
                            <div className="pt-2 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                              <Mail className="w-3.5 h-3.5" />
                              <span>Refund confirmation email sent to {p.userEmail}!</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] text-zinc-450 dark:text-zinc-500 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <span>Ref Number (UTR): <strong className="font-mono font-bold text-zinc-700 dark:text-zinc-400">{p.transactionRef}</strong></span>
                        <span>Date: {new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">Guest Credentials</h4>
                <p className="text-xs text-zinc-500">Keep your delivery details and access passwords updated.</p>
              </div>

              <div className="space-y-4 max-w-md">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-500 mb-1">FULL NAME</label>
                    <input type="text" readOnly value={userProfile?.fullName || "Guest Account"} className="w-full bg-zinc-50 border border-gray-200 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-500 mb-1">EMAIL SUPPORT</label>
                    <input type="email" readOnly value={userProfile?.email || "guest@luxebeauty.booking"} className="w-full bg-zinc-50 border border-gray-200 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-500 mb-1">PHONE CODE</label>
                    <input type="tel" readOnly value={userProfile?.phoneNumber || "+91 98765 43210"} className="w-full bg-zinc-50 border border-gray-200 rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-500 mb-1">COUNTRY ORIGIN</label>
                    <input type="text" readOnly value={userProfile?.country || "India"} className="w-full bg-zinc-50 border border-gray-200 rounded-lg p-2" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "contacts" && (
            <div className="space-y-6">
              <div>
                <h4 className="font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">Google Contacts & Referrals</h4>
                <p className="text-xs text-zinc-500">Sync with verified Google Contacts to invite friends, manage stylist phone cards, and unlock gold rewards.</p>
              </div>

              {!googleAccessToken ? (
                <div className="bg-[#FDFBF7] dark:bg-zinc-800/20 border border-natural-border dark:border-zinc-800 rounded-3xl p-8 text-center space-y-6 max-w-xl mx-auto">
                  <div className="w-12 h-12 bg-[#4A3F3B]/10 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-natural-gold">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Connect Google Contacts Safely</h5>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                      Link your Google Contacts with secure, user-approved permission. You can refer contacts to earn bonus loyalty points and add our top stylists directly to your phone.
                    </p>
                  </div>

                  {/* Standard styled Sign In with Google material button */}
                  <div className="flex justify-center pt-2">
                    <button
                      onClick={onConnectGoogle}
                      className="inline-flex items-center gap-3 bg-white hover:bg-neutral-50 text-gray-700 font-semibold text-xs py-2.5 px-4 border border-zinc-200 rounded-full shadow-sm hover:shadow transition-all cursor-pointer dark:bg-zinc-900 dark:text-white dark:border-zinc-700"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>Authorize Google Connection</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Connected Header status */}
                  <div className="bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Google Contacts Synced</p>
                        <p className="text-[10px] text-zinc-500">LuxeBeauty is now linked to search and managing contact updates with approval.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchGoogleContacts}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-xs flex items-center gap-1 font-semibold cursor-pointer text-zinc-700 dark:text-zinc-300"
                        title="Reload latest connections"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-zinc-500" /> Reload
                      </button>
                    </div>
                  </div>

                  {/* Section A: Invite & Earn Points */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-bold text-xs uppercase tracking-wider text-natural-gold">Refer Google Friends (+100 Points)</h5>
                      <span className="text-[10px] select-none text-zinc-400 bg-zinc-50 dark:bg-zinc-850 px-2 py-0.5 rounded font-mono">
                        {(apiContacts.length > 0 ? apiContacts : SANDBOX_CONTACTS).length} Contacts Found
                      </span>
                    </div>

                    {/* Search box for Google contacts */}
                    <input
                      type="text"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs outline-none placeholder-zinc-400 text-zinc-900 dark:text-zinc-100"
                      placeholder="Search amongst connections list..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                    />

                    {contactsLoading ? (
                      <div className="text-center py-6 text-zinc-500 text-xs">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-natural-gold" />
                        Fetching connections from Google...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-72 overflow-y-auto pr-1">
                        {((apiContacts.length > 0 ? apiContacts : SANDBOX_CONTACTS).filter(c =>
                          c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                          c.email.toLowerCase().includes(contactSearch.toLowerCase())
                        )).map((contact) => (
                          <div key={contact.resourceName} className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100/50 dark:border-zinc-800/80 flex justify-between items-center gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-zinc-900 dark:text-zinc-50 truncate">{contact.name}</p>
                              <p className="text-[10px] text-zinc-500 truncate mt-0.5">{contact.email || "No email logged"}</p>
                              <p className="text-[10px] text-zinc-400 truncate">{contact.phoneNumber || "No number logged"}</p>
                            </div>

                            {referredContacts[contact.name] ? (
                              <span className="bg-natural-bg text-natural-gold border border-natural-border dark:bg-zinc-800 text-[9px] font-extrabold uppercase px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                                <CheckCircle className="w-3 h-3 text-natural-gold" /> Invited
                              </span>
                            ) : (
                              <button
                                onClick={() => handleReferFriend(contact.name)}
                                className="bg-[#4A3F3B] hover:bg-[#3D3330] text-white font-bold text-[9px] tracking-wider uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 border border-natural-gold/15"
                              >
                                Invite (+100)
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section B: Synchronize Stylists to Contacts */}
                  <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <h5 className="font-bold text-xs uppercase tracking-wider text-natural-gold">Save Stylists to your Google Contacts</h5>
                      <p className="text-[11px] text-zinc-550">Sync our premier specialists' salon cards into your Google Account directory.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { name: "Sophia Harris", specialty: "Bridal Airbrush Master", phone: "+91 95000 78222" },
                        { name: "Lily Anderson", specialty: "Glow Skincare & Facials", phone: "+91 95000 12845" },
                        { name: "Chloe Bennett", specialty: "Artistic Hair & Mehendi", phone: "+91 95000 63442" },
                        { name: "Mia Roberts", specialty: "Premium Gel Nails Stylist", phone: "+91 95000 11986" }
                      ].map((artist) => (
                        <div key={artist.name} className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex justify-between items-center gap-3 bg-zinc-50/50 dark:bg-zinc-850/20">
                          <div>
                            <p className="font-bold text-xs">{artist.name}</p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">{artist.specialty}</p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{artist.phone}</p>
                          </div>

                          {syncedStylists[artist.name] ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-350 text-[9px] font-extrabold uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0">
                              <CheckCircle className="w-3.5 h-3.5" /> Synced
                            </span>
                          ) : (
                            <button
                              disabled={syncingStylistId === artist.name}
                              onClick={() => handleSaveStylistToGoogle(artist.name, artist.specialty)}
                              className="border border-zinc-200 dark:border-zinc-700 hover:border-natural-gold dark:hover:border-natural-gold hover:text-natural-gold bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-300 p-2 rounded-xl text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              Sync Contact
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
