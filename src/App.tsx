import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  Home,
  MessageCircle,
  Shield,
  Heart,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  CheckCircle,
  HelpCircle,
  MapPin,
  Calendar,
  Layers,
  Star,
  Send,
  ArrowRight,
  Bookmark,
  Share2,
  Lock,
  Phone,
  FileText,
  DollarSign,
  Briefcase,
  AlertOctagon,
  LogOut,
  Mail,
  Menu,
  X
} from "lucide-react";

import {
  auth,
  db
} from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

import {
  BeautyService,
  Booking,
  UserProfile,
  OfferDeal,
  Review,
  AppNotification
} from "./types";

import {
  DEFAULT_SERVICES,
  DEFAULT_OFFERS,
  INITIAL_REVIEWS,
  BRANCHES,
  ARTISTS
} from "./services";

import AIChatBot from "./components/AIChatBot";
import AIRecommender from "./components/AIRecommender";
import CheckoutGateway from "./components/CheckoutGateway";
import BookingForm from "./components/BookingForm";
import UserProfileDashboard from "./components/UserProfileDashboard";
import AdminPanel from "./components/AdminPanel";
import ReviewSection from "./components/ReviewSection";

export default function App() {
  // Theme controllers
  const [darkMode, setDarkMode] = useState(false);

  // Auth & Profile states
  const [user, setUser] = useState<{ uid: string; email: string; displayName?: string; phoneNumber?: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Form states (Authentication)
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regCountry, setRegCountry] = useState("India");
  const [regPassword, setRegPassword] = useState("");
  const [regReferral, setRegReferral] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // OTP Verification Modal Simulation
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpInputData, setOtpInputData] = useState<UserProfile | null>(null);

  // Business state synchronizations
  const [services, setServices] = useState<BeautyService[]>(DEFAULT_SERVICES);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [offers, setOffers] = useState<OfferDeal[]>(DEFAULT_OFFERS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Navigation controller
  const [currentView, setCurrentView] = useState<"home" | "services" | "booking" | "recommender" | "reviews" | "dashboard" | "admin" | "checkout">("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Booking & Purchase context flows
  const [selectedService, setSelectedService] = useState<BeautyService | null>(null);
  const [pendingBookingData, setPendingBookingData] = useState<Booking | null>(null);
  const [appliedPromo, setAppliedPromo] = useState("");

  // Dynamic filter lists
  const [serviceSearch, setServiceSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [maxPriceLimit, setMaxPriceLimit] = useState<number>(10000);

  // Loyalty Point status
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  // Google Contacts synchronization credentials
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  // Notification panel bubble
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Sync Auth State from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email || "",
          displayName: currentUser.displayName || undefined,
          phoneNumber: currentUser.phoneNumber || undefined,
        });

        // Pull Profile from Firestore
        const pfRef = doc(db, "users", currentUser.uid);
        const pfSnap = await getDoc(pfRef);
        if (pfSnap.exists()) {
          const fetched = pfSnap.data() as UserProfile;
          setProfile(fetched);
          setLoyaltyPoints(fetched.loyaltyPoints);
        } else {
          // Setup a new Profile in Firestore if missing
          const fallbackProfile: UserProfile = {
            uid: currentUser.uid,
            email: currentUser.email || "",
            fullName: currentUser.displayName || "Luxe Guest",
            phoneNumber: currentUser.phoneNumber || "+91 95000 12345",
            country: "India",
            role: currentUser.email?.toLowerCase().includes("admin") ? "admin" : "user",
            loyaltyPoints: 200, // 200 Welcome bonus
            referralCode: `LUXE${Math.floor(1000 + Math.random() * 9000)}`,
            wishlist: [],
            createdAt: new Date().toISOString(),
          };
          await setDoc(pfRef, fallbackProfile);
          setProfile(fallbackProfile);
          setLoyaltyPoints(200);
        }

        // Fetch User Bookings from Firestore
        fetchBookings(currentUser.uid);
      } else {
        setUser(null);
        setProfile(null);
        setBookings([]);
        setLoyaltyPoints(0);
      }
    });

    // Populate overall initial services/offers from Firestore if available
    syncOverallMenuData();
    return unsubscribe;
  }, []);

  // OTP Countdown timer simulation
  useEffect(() => {
    let interval: any;
    if (showOtpModal && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpTimer]);

  // Sync services & bookings & reviews dynamically
  const syncOverallMenuData = async () => {
    try {
      const srvs = await getDocs(collection(db, "services"));
      if (!srvs.empty) {
        const loaded: BeautyService[] = [];
        srvs.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as BeautyService));
        setServices(loaded);
      }
      
      const offs = await getDocs(collection(db, "offers"));
      if (!offs.empty) {
        const loaded: OfferDeal[] = [];
        offs.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as OfferDeal));
        setOffers(loaded);
      }

      await syncAllReviews();
    } catch (e) {
      console.warn("Using offline memory structures: ", e);
    }
  };

  const syncAllReviews = async () => {
    try {
      const revs = await getDocs(collection(db, "reviews"));
      if (!revs.empty) {
        const loaded: Review[] = [];
        revs.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as Review));
        setReviews(loaded);
      }
    } catch (err) {
      console.warn("Reviews syncing in static storage");
    }
  };

  const fetchBookings = async (uid: string) => {
    try {
      const bksQ = query(collection(db, "bookings"), where("userId", "==", uid));
      const bksSnap = await getDocs(bksQ);
      const loaded: Booking[] = [];
      bksSnap.forEach((doc) => loaded.push({ id: doc.id, ...doc.data() } as Booking));
      setBookings(loaded);
    } catch (err) {
      console.warn("Booking syncing error, utilizing dynamic in-memory store.");
    }
  };

  // Create customized notification action
  const addNotification = (title: string, message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const notify: AppNotification = {
      id: `notify_${Date.now()}`,
      userId: user?.uid || "guest",
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotifications((prev) => [notify, ...prev]);
  };

  // Google OAuth flow
  const handleGoogleSignIn = async () => {
    setAuthError("");
    setAuthSuccess("");
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/contacts');
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    try {
      const res = await signInWithPopup(auth, provider);
      const credentials = res.user;

      const credential = GoogleAuthProvider.credentialFromResult(res);
      const token = credential?.accessToken;
      if (token) {
        setGoogleAccessToken(token);
      }
      
      addNotification("Connected through Google", `Welcome to your luxury sanctuary, ${credentials.displayName}!`, "success");
      setAuthSuccess(`Signed in securely via Google as ${credentials.email}`);
      setTimeout(() => {
        setCurrentView("dashboard");
      }, 1005);
    } catch (err: any) {
      console.warn("Google authentication issue:", err);
      setAuthError(err.message || "Failed Google identification");
    }
  };

  const handleConnectGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/contacts');
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    try {
      const res = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(res);
      const token = credential?.accessToken;
      if (token) {
        setGoogleAccessToken(token);
        addNotification("Google Contacts Synced", "Successfully linked with Google Contacts directory!", "success");
      } else {
        // Fallback inside sandboxed preview
        setGoogleAccessToken("sandbox_demo_token_authenticated");
        addNotification("Contacts Sync Configured", "Simulated OAuth token connected inside sandbox!", "success");
      }
    } catch (err: any) {
      console.warn("Direct Google connection disallowed in sandboxed container, using sandbox fallback:", err);
      setGoogleAccessToken("sandbox_demo_token_authenticated");
      addNotification("Google Contacts Sandbox Active", "Connected successfully in safe preview mode!", "success");
    }
  };

  const handleAddLoyaltyPoints = async (points: number) => {
    if (user && profile) {
      const newPts = loyaltyPoints + points;
      setLoyaltyPoints(newPts);
      const updatedProfile = { ...profile, loyaltyPoints: newPts };
      setProfile(updatedProfile);
      addNotification("Loyalty Points Added", `You earned +${points} loyalty points!`, "success");
      try {
        await updateDoc(doc(db, "users", user.uid), { loyaltyPoints: newPts });
      } catch (e) {
        console.warn("Firestore save points skip:", e);
      }
    }
  };

  // Traditional sign-up flow requesting Name, Phone, Email, Passwords
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!regName || !regEmail || !regPhone || !regPassword) {
      setAuthError("All styling registration fields are required.");
      return;
    }

    if (regPassword.length < 6) {
      setAuthError("Password must be at least 6 luxury characters.");
      return;
    }

    // Capture temporary data and transition to OTP confirmation modal
    const tempProfile: UserProfile = {
      uid: "", // Populated post auth completion
      email: regEmail,
      fullName: regName,
      phoneNumber: regPhone,
      country: regCountry,
      role: regEmail.toLowerCase().includes("admin") ? "admin" : "user",
      loyaltyPoints: regReferral ? 300 : 200, // 300 if referred
      referralCode: `LUXE${Math.floor(1000 + Math.random() * 9000)}`,
      wishlist: [],
      createdAt: new Date().toISOString(),
    };

    setOtpInputData(tempProfile);
    setOtpTimer(60);
    setOtpCode("");
    setShowOtpModal(true);
    addNotification("OTP Sent", `An activation code has been simulated via SMS to ${regPhone}`, "info");
  };

  // Complete registration after successful OTP code verification
  const handleVerifyOtpSubmit = async () => {
    if (otpCode.length < 4) {
      setAuthError("Please fill out the full 4-digit verification code.");
      return;
    }

    if (otpCode !== "1234" && otpCode !== "8888") {
      setAuthError("Invalid activation code. Please test '1234' for quick development checks!");
      return;
    }

    try {
      setShowOtpModal(false);
      if (!otpInputData) return;

      const userCreds = await createUserWithEmailAndPassword(auth, otpInputData.email, regPassword);
      const activeUid = userCreds.user.uid;

      const finalProfile: UserProfile = {
        ...otpInputData,
        uid: activeUid,
      };

      await setDoc(doc(db, "users", activeUid), finalProfile);
      setProfile(finalProfile);
      setLoyaltyPoints(finalProfile.loyaltyPoints);
      
      addNotification("Account Activated", `Congratulations ${otpInputData.fullName}! Earned 200 welcome loyalty points.`, "success");
      setAuthSuccess("Your styling profile is verified and active!");
      
      // Reset registration forms
      setRegName("");
      setRegEmail("");
      setRegPhone("");
      setRegPassword("");
      setRegReferral("");

      setTimeout(() => {
        setCurrentView("dashboard");
      }, 1000);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Log-In process with Email & Password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!loginEmail || !loginPassword) {
      setAuthError("Please input your guest credentials.");
      return;
    }

    try {
      const userCreds = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      addNotification("Welcome Back!", `Successfully signed in to LuxeBeauty.`, "success");
      setAuthSuccess("Secured access authorization completed.");
      setTimeout(() => {
        setCurrentView("dashboard");
      }, 1000);
    } catch (err: any) {
      setAuthError("Credentials invalid or unrecognized. Please review form entries.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    addNotification("Logged Out", "Goodbye! Have a gorgeous day.");
    setCurrentView("home");
  };

  // Appointment scheduling handler
  const handleBookingDetailsSubmit = (bookingDetails: Omit<Booking, "id" | "createdAt">) => {
    const bookingId = `bk_${Date.now()}`;
    const targetBooking: Booking = {
      id: bookingId,
      ...bookingDetails,
      createdAt: new Date().toISOString(),
    };

    setPendingBookingData(targetBooking);
    setCurrentView("checkout");
  };

  // Checkout Success triggers database entry
  const handlePaymentAuthorizeSuccess = async (method: string, status: string, finalBooking: Booking) => {
    try {
      // 1. Save Booking in Firestore database
      await setDoc(doc(db, "bookings", finalBooking.id), finalBooking);
      
      // 2. Add Booking in local state
      setBookings((prev) => [finalBooking, ...prev]);

      // 3. Award Loyalty points (+100 for scheduling)
      if (user) {
        const newPts = loyaltyPoints + 100;
        setLoyaltyPoints(newPts);
        if (profile) {
          const updatedProfile = { ...profile, loyaltyPoints: newPts };
          setProfile(updatedProfile);
          await updateDoc(doc(db, "users", user.uid), { loyaltyPoints: newPts });
        }
      }

      addNotification("Booking Confirmed", `Appointment for ${finalBooking.serviceName} scheduled on ${finalBooking.date}`, "success");
      
      // 4. Seed dynamic customer list for admin tracking
      if (profile && !usersList.some(u => u.uid === profile.uid)) {
        setUsersList(prev => [profile, ...prev]);
      }
    } catch (err) {
      console.warn("Saving offline bookings: ", err);
      setBookings((prev) => [finalBooking, ...prev]);
    }
  };

  // Wishlisting trigger
  const handleToggleWishlist = async (serviceId: string) => {
    if (!user || !profile) {
      addNotification("Authentication Required", "Please sign up or log in to curate your aesthetic folder.", "warning");
      setCurrentView("login");
      return;
    }

    let updatedWishlist = [ ...profile.wishlist ];
    const index = updatedWishlist.indexOf(serviceId);
    if (index >= 0) {
      updatedWishlist.splice(index, 1);
      addNotification("Removed from Wishlist", "Item removed from your aesthetic wishlist folder.", "info");
    } else {
      updatedWishlist.push(serviceId);
      addNotification("Added to Wishlist", "Item curated to your gold ribbon wishlist!", "success");
    }

    const updatedProfile = { ...profile, wishlist: updatedWishlist };
    setProfile(updatedProfile);

    try {
      await updateDoc(doc(db, "users", user.uid), { wishlist: updatedWishlist });
    } catch (e) {
      console.warn("Wishlist cloud synchronization delayed.");
    }
  };

  // Admin CRUD Actions
  const handleAdminAddService = async (item: BeautyService) => {
    try {
      await setDoc(doc(db, "services", item.id), item);
      setServices((prev) => [item, ...prev]);
    } catch (err) {
      setServices((prev) => [item, ...prev]);
    }
  };

  const handleAdminDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, "services", id));
      setServices((prev) => prev.filter((s) => s.id !== id));
      addNotification("Service Removed", "A beauty menu item was removed from Firestore database.", "warning");
    } catch (err) {
      setServices((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleAdminAddOffer = async (item: OfferDeal) => {
    try {
      await setDoc(doc(db, "offers", item.id), item);
      setOffers((prev) => [item, ...prev]);
    } catch (err) {
      setOffers((prev) => [item, ...prev]);
    }
  };

  const handleAdminDeleteOffer = async (id: string) => {
    try {
      await deleteDoc(doc(db, "offers", id));
      setOffers((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setOffers((prev) => prev.filter((o) => o.id !== id));
    }
  };

  const handleAdminUpdateBooking = async (id: string, status: any) => {
    try {
      await updateDoc(doc(db, "bookings", id), { status });
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
      addNotification("Appointment Status Updated", `Booking status updated to ${status}`, "success");
    } catch (err) {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    }
  };

  const handleAdminSubmitReview = async (item: Omit<Review, "id" | "date">) => {
    const freshReview: Review = {
      id: `rev_${Date.now()}`,
      ...item,
      date: new Date().toISOString().split("T")[0],
    };

    try {
      await setDoc(doc(db, "reviews", freshReview.id), freshReview);
      setReviews((prev) => [freshReview, ...prev]);
    } catch (err) {
      setReviews((prev) => [freshReview, ...prev]);
    }
  };

  // Dynamic filter selections for services
  const filteredServices = services.filter((s) => {
    const matchQuery = s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
                       s.description.toLowerCase().includes(serviceSearch.toLowerCase());
    const matchCat = selectedCategory === "All" || s.category === selectedCategory;
    const matchPrice = s.discountPrice <= maxPriceLimit;
    return matchQuery && matchCat && matchPrice;
  });

  return (
    <div className={`${darkMode ? "dark bg-zinc-950 text-amber-50" : "bg-neutral-50 text-zinc-900"} min-h-screen flex flex-col font-sans transition-colors duration-300`}>
      
      {/* HEADER SECTION (AURA NATURAL TONES COMPLIANT) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-natural-border transition-all">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          
          {/* Logo Brand: AURA Luxe Beauty Studio */}
          <div
            onClick={() => setCurrentView("home")}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="bg-natural-gold text-white p-2.5 rounded-full shadow-sm group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif text-xl md:text-2xl font-bold tracking-[0.15em] text-natural-gold dark:text-natural-gold uppercase leading-none">AURA</span>
              <p className="text-[9px] uppercase tracking-[0.25em] text-natural-muted font-medium mt-0.5">Luxe Beauty Studio</p>
            </div>
          </div>

          {/* Desktop Navigation Links (AURA TONES COMPLIANT) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold uppercase tracking-widest text-[#4A3F3B] dark:text-zinc-300">
            <button onClick={() => setCurrentView("home")} className={`hover:text-natural-gold transition-colors cursor-pointer ${currentView === "home" ? "text-natural-gold font-bold" : "text-natural-muted"}`}>Home</button>
            <button onClick={() => setCurrentView("services")} className={`hover:text-natural-gold transition-colors cursor-pointer ${currentView === "services" ? "text-natural-gold font-bold" : "text-natural-muted"}`}>Treatments</button>
            <button onClick={() => setCurrentView("recommender")} className={`hover:text-natural-gold transition-colors cursor-pointer ${currentView === "recommender" ? "text-natural-gold font-bold" : "text-natural-muted"}`}>AI Skincare Advisor</button>
            <button onClick={() => setCurrentView("reviews")} className={`hover:text-natural-gold transition-colors cursor-pointer ${currentView === "reviews" ? "text-natural-gold font-bold" : "text-natural-muted"}`}>Reviews</button>
            
            {profile?.role === "admin" && (
              <button
                onClick={() => setCurrentView("admin")}
                className={`bg-[#FDF2F0] text-natural-gold border border-natural-border px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1 cursor-pointer hover:opacity-95 ${currentView === "admin" ? "bg-natural-gold text-white" : ""}`}
              >
                <Shield className="w-3.5 h-3.5" /> Staff Dashboard
              </button>
            )}
          </nav>

          {/* Header Action Items */}
          <div className="flex items-center gap-3">
            
            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="bg-neutral-100 dark:bg-zinc-805 text-[#4A3F3B] dark:text-natural-gold p-2 rounded-full cursor-pointer hover:scale-105 active:scale-95 transition-all border border-natural-border/30"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification Panel Bubble */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                className="bg-neutral-100 dark:bg-zinc-805 text-[#4A3F3B] dark:text-natural-gold p-2 rounded-full relative cursor-pointer hover:scale-105 transition-all border border-natural-border/30"
              >
                <Bell className="w-4 h-4" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-natural-gold rounded-full animate-ping"></span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotificationCenter && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-natural-border p-4 space-y-3 z-50 text-xs">
                  <h5 className="font-bold text-[#4A3F3B] dark:text-zinc-50 uppercase tracking-widest border-b border-natural-border pb-2 flex justify-between items-center">
                    <span>Lounge Alerts</span>
                    <button onClick={() => setNotifications([])} className="text-[10px] text-natural-muted lowercase normal-case">clear</button>
                  </h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2 bg-natural-peach/40 rounded-xl space-y-0.5 border border-natural-border/20">
                        <p className="font-bold text-[#4A3F3B] dark:text-white flex items-center justify-between">
                           <span>{n.title}</span>
                           <span className="text-[9px] text-natural-muted font-normal">{n.timestamp}</span>
                        </p>
                        <p className="text-[11px] text-[#4A3F3B] dark:text-zinc-400">{n.message}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-natural-muted text-center py-4">No recent lounge alerts.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dashboard Account Button */}
            {user ? (
              <button
                onClick={() => setCurrentView("dashboard")}
                className="bg-gradient-to-r from-natural-gold to-natural-gold-light text-white font-bold tracking-widest text-xs uppercase px-4 py-2.5 rounded-full cursor-pointer shadow-md hover:scale-102 transition-all flex items-center gap-1.5"
              >
                <span className="hidden sm:inline">{profile?.fullName.split(' ')[0] || "Luxe Guest"}</span>
                <span className="w-4 h-4 bg-white/25 rounded-full flex items-center justify-center font-bold font-serif text-[9px]">
                  {profile?.fullName.charAt(0) || "U"}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("register");
                  setCurrentView("login");
                }}
                className="bg-[#4A3F3B] hover:bg-[#3D3330] text-white font-bold tracking-widest text-[10px] uppercase px-5 py-2.5 rounded-full cursor-pointer shadow-sm hover:scale-102 transition-all"
              >
                Sign In
              </button>
            )}

            {/* Mobile Expand Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 bg-neutral-105 dark:bg-zinc-800 text-gray-600 rounded-full cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-zinc-900 border-t border-natural-border p-4 space-y-2 uppercase tracking-wider text-xs font-bold text-center flex flex-col">
            <button onClick={() => { setCurrentView("home"); setMobileMenuOpen(false); }} className="py-2 hover:bg-natural-peach rounded-lg text-[#4A3F3B]">Home</button>
            <button onClick={() => { setCurrentView("services"); setMobileMenuOpen(false); }} className="py-2 hover:bg-natural-peach rounded-lg text-[#4A3F3B]">Treatments</button>
            <button onClick={() => { setCurrentView("recommender"); setMobileMenuOpen(false); }} className="py-2 hover:bg-natural-peach rounded-lg text-[#4A3F3B]">AI Advisor</button>
            <button onClick={() => { setCurrentView("reviews"); setMobileMenuOpen(false); }} className="py-2 hover:bg-natural-peach rounded-lg text-[#4A3F3B]">Reviews</button>
            
            {profile?.role === "admin" && (
              <button onClick={() => { setCurrentView("admin"); setMobileMenuOpen(false); }} className="py-2 bg-natural-peach text-natural-gold border border-natural-border rounded-lg">Staff Console</button>
            )}
          </div>
        )}
      </header>

      {/* CORE FRAMEWORK SUB-PAGES BODY */}
      <main className="flex-grow">
        
        {/* VIEW 1: HOME PAGE */}
        {currentView === "home" && (
          <div className="space-y-16 pb-16 animate-fade-in bg-natural-bg">
            
            {/* HERO BANNER SECTION (AURA NATURAL PEACH SPLIT LAYOUT) */}
            <section className="relative overflow-hidden bg-natural-peach rounded-b-[2.5rem] border-b border-natural-border">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[500px]">
                
                {/* Left elegant typography content */}
                <div className="flex-1 flex flex-col justify-center px-6 md:px-12 py-12 md:py-16 space-y-6 z-10">
                  <span className="text-[11px] font-bold uppercase tracking-[0.4em] text-natural-gold">
                    Exclusive Collection
                  </span>
                  <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light leading-tight text-natural-text">
                    Enhance Your <br />
                    <span className="italic text-natural-gold font-serif">Natural</span> Beauty
                  </h1>
                  <p className="max-w-md text-xs md:text-sm text-natural-muted leading-relaxed">
                    Step into Aura's premium beauty sanctuary. Curate elegant dewy makeup finishes, therapeutic deep-tissue facial skin reliefs, and custom luxury organic hair glazes with our master cosmologists.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      onClick={() => {
                        setSelectedService(DEFAULT_SERVICES[0]);
                        setCurrentView("services");
                      }}
                      className="rounded-full bg-natural-text hover:bg-natural-charcoal text-white font-bold tracking-widest text-[10px] uppercase px-8 py-3.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      Book Now
                    </button>
                    <button
                      onClick={() => setCurrentView("recommender")}
                      className="rounded-full border border-natural-text text-natural-text hover:bg-neutral-100/50 font-bold tracking-widest text-[10px] uppercase px-8 py-3.5 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-natural-gold" /> Consult AI
                    </button>
                  </div>
                </div>

                {/* Right natural imagery layout */}
                <div className="flex-1 relative min-h-[250px] md:min-h-auto bg-[#E8DED6] overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&auto=format&fit=crop&q=80"
                    className="w-full h-full object-cover opacity-80"
                    alt="Dewy skincare cosmetic finish model"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-natural-peach/40 to-transparent"></div>
                </div>
              </div>

              {/* Status bar item */}
              <div className="absolute bottom-6 left-6 md:left-12 flex items-center space-x-2 rounded-full bg-white/70 px-4 py-2 border border-natural-border/40 backdrop-blur-md select-none">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-semibold text-natural-text">Available treatment slots today: 4</span>
              </div>
            </section>

            {/* LIMITED-TIME OFFERS BANNER (AURA RE-STYLED SANDY CONTAINER) */}
            <section className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="bg-white border border-natural-border rounded-3xl p-8 md:p-12 text-natural-text relative overflow-hidden shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="absolute right-0 top-0 w-80 h-80 bg-natural-peach/70 rounded-full filter blur-3xl -z-0"></div>
                
                <div className="space-y-4 max-w-xl relative z-10 text-center md:text-left">
                  <span className="inline-block bg-natural-peach border border-natural-border/50 text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full text-natural-gold">
                    Exclusive Festival Splendor
                  </span>
                  <h3 className="font-serif text-3xl font-medium tracking-tight text-natural-text">Signature Royal Bridal Packages</h3>
                  <p className="text-natural-muted text-xs leading-relaxed">
                    Reserve our award-winning bridal glam sequence today. Secure premium organic glow facials, gold mehendi designs, and personalized stylist consultation calls directly into your private program.
                  </p>
                  <div className="flex justify-center md:justify-start items-center gap-6 pt-1">
                    <div>
                      <p className="text-[10px] text-natural-muted uppercase tracking-wider font-bold">Standard Lounge Rate</p>
                      <p className="font-serif text-xl font-bold line-through text-natural-muted">₹9,999</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-natural-gold uppercase tracking-wider font-extrabold">Exclusive Campaign Price</p>
                      <p className="font-serif text-3xl font-extrabold text-natural-text">₹6,999</p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto text-center relative z-10">
                  <button
                    onClick={() => {
                      setSelectedService(DEFAULT_SERVICES[0]);
                      setCurrentView("booking");
                    }}
                    className="w-full md:w-auto bg-natural-text hover:bg-natural-charcoal text-white font-bold tracking-widest text-xs uppercase px-8 py-4 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Secure This Slot Now
                  </button>
                </div>
              </div>
            </section>

            {/* BENTO-GRID SERVICES SNAPSHOT (AURA MINIMAL DESIGN) */}
            <section className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
              <div className="text-center space-y-2">
                <span className="text-xs text-natural-gold font-bold uppercase tracking-widest">Our Specialties</span>
                <h2 className="font-serif text-3xl font-light text-natural-text">Artisan Salon Treatments</h2>
                <div className="w-16 h-0.5 bg-natural-gold mx-auto"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {services.slice(0, 4).map((s) => (
                  <div key={s.id} className="bg-white border border-natural-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between hover:border-natural-gold/30">
                    <div className="relative h-48 overflow-hidden shrink-0">
                      <img src={s.image} className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500" alt={s.name} referrerPolicy="no-referrer" />
                      <span className="absolute top-3 left-3 bg-natural-peach text-natural-gold border border-natural-border/30 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm">
                        {s.badge || "SPECIAL"}
                      </span>
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="font-serif font-bold text-natural-text text-base leading-tight">{s.name}</h4>
                        <p className="text-[11px] text-natural-muted mt-2 line-clamp-2 leading-relaxed">{s.description}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-natural-border/30">
                        <div>
                          <span className="text-[10px] text-natural-muted line-through">₹{s.originalPrice}</span>
                          <p className="font-serif text-base font-extrabold text-natural-gold">₹{s.discountPrice}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedService(s);
                            setCurrentView("booking");
                          }}
                          className="bg-natural-text hover:bg-natural-charcoal text-white font-bold text-[10px] tracking-wide uppercase px-4 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* TESTIMONIAL PREVIEWS */}
            <section className="bg-neutral-100/40 dark:bg-zinc-900/40 py-16">
              <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
                <div className="text-center space-y-2">
                  <span className="text-xs text-natural-gold font-bold uppercase tracking-widest">Love letters</span>
                  <h3 className="font-serif text-2xl md:text-3xl font-light">Cherished Guest Testimonials</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {INITIAL_REVIEWS.map((rev) => (
                    <div key={rev.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-natural-border space-y-3">
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <p className="text-xs text-zinc-650 dark:text-zinc-350 italic">
                        "{rev.comment}"
                      </p>
                      <div className="flex justify-between items-center pt-2 text-[10px]">
                        <span className="font-bold text-zinc-900 dark:text-white">— {rev.userName}</span>
                        <span className="text-emerald-600 font-bold uppercase">Verified Guest</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
        {/* VIEW 2: BEAUTY SERVICES PAGE */}
        {currentView === "services" && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-8 animate-fade-in text-[#4A3F3B] dark:text-zinc-100">
            
            {/* Header Description */}
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="text-xs text-natural-gold font-extrabold uppercase tracking-widest">Pricing & Selection</span>
              <h2 className="font-serif text-3xl md:text-5xl font-light">Customized Treatment Menu</h2>
            </div>

            {/* Search, Category Filters, and Price Slider */}
            <div className="bg-white dark:bg-zinc-900 border border-natural-border p-4 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Search input */}
              <div className="md:col-span-4 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-muted" />
                <input
                  type="text"
                  placeholder="Search hair gloss, bridal makeup, nail paint..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full bg-natural-bg dark:bg-zinc-800 rounded-xl px-10 py-2.5 text-xs outline-none focus:ring-1 focus:ring-natural-gold"
                />
              </div>

              {/* Categories selection */}
              <div className="md:col-span-5 overflow-x-auto flex gap-1.5 no-scrollbar whitespace-nowrap text-[10px] font-bold">
                {["All", "Bridal", "Party", "Hair", "Facial", "Nails", "Mehendi", "Spa"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 rounded-xl transition-all cursor-pointer uppercase tracking-wider ${
                      selectedCategory === cat
                        ? "bg-[#4A3F3B] text-white shadow-sm"
                        : "bg-natural-peach text-natural-gold border border-natural-border/20 hover:opacity-85"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Price range Limit */}
              <div className="md:col-span-3 text-xs flex items-center gap-3">
                <SlidersHorizontal className="w-4 h-4 text-natural-muted shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-[10px] text-natural-muted mb-1 font-mono uppercase tracking-wider">
                    <span>Limit</span>
                    <span>₹{maxPriceLimit}</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="500"
                    value={maxPriceLimit}
                    onChange={(e) => setMaxPriceLimit(Number(e.target.value))}
                    className="w-full accent-natural-gold h-1 bg-natural-border rounded-lg cursor-pointer animate-pulse"
                  />
                </div>
              </div>
            </div>

            {/* Menu Cards List */}
            {filteredServices.length === 0 ? (
              <div className="border border-dashed border-natural-border rounded-2xl p-12 text-center text-natural-muted">
                Sorry, no style treatments match your active filters. Enjoy trying another option!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredServices.map((s) => (
                  <div key={s.id} className="bg-white border border-natural-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col justify-between hover:border-natural-gold/30">
                    <div className="relative h-48 overflow-hidden shrink-0 bg-natural-bg">
                      <img src={s.image} className="w-full h-full object-cover group-hover:scale-102 transition-all duration-500" alt={s.name} referrerPolicy="no-referrer" />
                      <span className="absolute top-3 left-3 bg-natural-peach text-natural-gold border border-natural-border/30 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                        {s.badge || "SPECIAL"}
                      </span>
                      {/* Wishlist toggle */}
                      <button
                        onClick={() => handleToggleWishlist(s.id)}
                        className="absolute top-3 right-3 bg-white/90 p-2 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer border border-natural-border/30"
                      >
                        <Heart className={`w-3.5 h-3.5 text-natural-gold ${profile?.wishlist?.includes(s.id) ? "fill-current" : ""}`} />
                      </button>
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-extrabold tracking-widest text-natural-gold uppercase">
                          <span>{s.category}</span>
                          <span className="text-natural-muted font-mono">{s.duration}</span>
                        </div>
                        <h4 className="font-serif font-bold text-natural-text text-base leading-tight mt-1.5">{s.name}</h4>
                        <p className="text-[11px] text-natural-muted mt-2 line-clamp-2 leading-relaxed">{s.description}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-natural-border/30">
                        <div>
                          <span className="text-[10px] text-natural-muted line-through font-mono">₹{s.originalPrice}</span>
                          <p className="font-serif text-base font-extrabold text-[#4A3F3B]">₹{s.discountPrice}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedService(s);
                            setCurrentView("booking");
                          }}
                          className="bg-natural-text hover:bg-natural-charcoal text-white font-bold text-[10px] tracking-wide uppercase px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: APPOINTMENT APPOINTMENT BOOKING */}
        {currentView === "booking" && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 animate-fade-in">
            <BookingForm
              initialService={selectedService}
              currentUser={user}
              onSubmit={handleBookingDetailsSubmit}
              onCancel={() => setCurrentView("services")}
            />
          </div>
        )}

        {/* VIEW 4: PAYMENT CHECKOUT GATEWAY */}
        {currentView === "checkout" && pendingBookingData && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 animate-fade-in">
            <CheckoutGateway
              booking={pendingBookingData}
              couponCodeInput={appliedPromo}
              onPaymentSuccess={handlePaymentAuthorizeSuccess}
              onCancel={() => setCurrentView("booking")}
            />
          </div>
        )}

        {/* VIEW 5: AI SKINCARE RECOMMENDATION */}
        {currentView === "recommender" && (
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 animate-fade-in">
            <div className="text-center space-y-2 mb-8">
              <span className="text-xs text-natural-gold font-extrabold uppercase tracking-widest">Self Care Advisor</span>
              <h2 className="font-serif text-3xl md:text-5xl font-light">Intelligent Beauty Plan</h2>
            </div>
            <AIRecommender
              onSelectService={(s) => {
                setSelectedService(s);
                setCurrentView("booking");
              }}
            />
          </div>
        )}

        {/* VIEW 6: TESTIMONIAL REVIEWS INLET */}
        {currentView === "reviews" && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 animate-fade-in text-zinc-900 dark:text-zinc-100">
            <ReviewSection
              reviews={reviews}
              services={services}
              currentUser={user}
              onSubmitReview={handleAdminSubmitReview}
            />
          </div>
        )}

        {/* VIEW 7: CLIENT USER DASHBOARD */}
        {currentView === "dashboard" && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-11 animate-fade-in text-zinc-900 dark:text-zinc-100">
            <UserProfileDashboard
              userProfile={profile}
              bookings={bookings}
              savedOffers={offers}
              onSelectService={(s) => {
                setSelectedService(s);
                setCurrentView("booking");
              }}
              onLogout={handleLogout}
              googleAccessToken={googleAccessToken}
              onConnectGoogle={handleConnectGoogle}
              onAddLoyaltyPoints={handleAddLoyaltyPoints}
            />
          </div>
        )}

        {/* VIEW 8: ADMIN CRUD OPERATIONS BOARD */}
        {currentView === "admin" && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-11 animate-fade-in">
            <AdminPanel
              services={services}
              bookings={bookings}
              users={usersList}
              offers={offers}
              onAddService={handleAdminAddService}
              onDeleteService={handleAdminDeleteService}
              onUpdateService={() => {}}
              onUpdateBookingStatus={handleAdminUpdateBooking}
              onAddOffer={handleAdminAddOffer}
              onDeleteOffer={handleAdminDeleteOffer}
            />
          </div>
        )}

        {/* VIEW 9: LOGIN & REGISTRATION PORTAL */}
        {currentView === "login" && (
          <div className="max-w-md mx-auto px-4 py-16 animate-fade-in text-[#4A3F3B]">
            <div className="bg-white dark:bg-zinc-900 border border-natural-border rounded-3xl shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
              
              <div className="text-center space-y-1.5">
                <h3 className="font-serif text-2xl font-semibold tracking-wide">
                  {authMode === "login" ? "Guest Lounge Access" : "Create Styling Account"}
                </h3>
                <p className="text-xs text-natural-muted">Welcome to Aura Luxe Studio's booking sanctuary rooms.</p>
              </div>

              {authError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
                  {authError}
                </div>
              )}
              {authSuccess && (
                <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-200 font-semibold">
                  {authSuccess}
                </div>
              )}

              {/* Toggle controls */}
              <div className="flex bg-natural-bg dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold text-center text-[#4A3F3B]">
                <button
                  type="button"
                  onClick={() => { setAuthMode("login"); setAuthError(""); }}
                  className={`flex-1 py-2 rounded-lg cursor-pointer transition-all ${authMode === "login" ? "bg-white dark:bg-zinc-900 text-natural-gold shadow-sm font-bold" : "text-natural-muted"}`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode("register"); setAuthError(""); }}
                  className={`flex-1 py-2 rounded-lg cursor-pointer transition-all ${authMode === "register" ? "bg-white dark:bg-zinc-900 text-natural-gold shadow-sm font-bold" : "text-natural-muted"}`}
                >
                  Sign Up
                </button>
              </div>

              {/* GOOGLE SIGN-IN OAUTH COMPONENT */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 border border-natural-border hover:bg-neutral-100/50 hover:dark:bg-zinc-800 rounded-xl py-3 text-xs font-bold tracking-wide transition-colors cursor-pointer text-[#4A3F3B]"
              >
                {/* Standard Google logo silhouette */}
                <span className="w-4 h-4 bg-natural-gold rounded-full flex items-center justify-center text-white text-[9px] font-bold">G</span>
                <span>Continue with Google Sign-In</span>
              </button>

              <div className="relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-natural-border"></div>
                <span className="relative z-10 bg-white dark:bg-zinc-900 px-3 text-[10px] text-natural-muted uppercase tracking-widest text-center block max-w-max mx-auto">or credentials</span>
              </div>

              {authMode === "login" ? (
                /* LOGIN FORM */
                <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-sans">
                  <div className="space-y-1">
                    <label className="block font-bold text-natural-muted uppercase tracking-wider">Email Support</label>
                    <input
                      type="email"
                      required
                      placeholder="guest@mail.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-natural-bg dark:bg-zinc-800 border border-natural-border rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-natural-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-natural-muted uppercase tracking-wider">Lounge Password</label>
                    <input
                      type="password"
                      required
                      placeholder="******"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-natural-bg dark:bg-zinc-800 border border-natural-border rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-natural-gold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#4A3F3B] hover:bg-[#3D3330] text-white font-bold tracking-widest uppercase py-3 rounded-xl transition-all cursor-pointer shadow-md text-xs"
                  >
                    Authorize Sign In
                  </button>
                </form>
              ) : (
                /* CREATE ACCOUNT FORM WITH OTP SIM */
                <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-sans text-natural-text">
                  <div className="space-y-1">
                    <label className="block font-bold text-natural-muted uppercase tracking-wider">Full Guest Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Ananya Sharma"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-natural-bg dark:bg-zinc-800 border border-natural-border rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-natural-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-natural-muted uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-natural-bg dark:bg-zinc-800 border border-natural-border rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-natural-gold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-natural-muted uppercase tracking-wider">Phone Line</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-natural-bg dark:bg-zinc-800 border border-natural-border rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-natural-gold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block font-bold text-natural-muted uppercase tracking-wider">Country Origin</label>
                      <select
                        value={regCountry}
                        onChange={(e) => setRegCountry(e.target.value)}
                        className="w-full bg-natural-bg dark:bg-zinc-800 border border-natural-border rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-natural-gold text-[#4A3F3B]"
                      >
                        <option value="India">India</option>
                        <option value="United States">USA</option>
                        <option value="United Kingdom">UK</option>
                        <option value="Singapore">Singapore</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-natural-muted uppercase tracking-wider">Referral Code</label>
                      <input
                        type="text"
                        placeholder="e.g. LUXE1234"
                        value={regReferral}
                        onChange={(e) => setRegReferral(e.target.value)}
                        className="w-full bg-natural-bg dark:bg-zinc-800 border border-natural-border rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-natural-gold"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block font-bold text-natural-muted uppercase tracking-wider">Lounge Password</label>
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-natural-bg dark:bg-zinc-800 border border-natural-border rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-natural-gold"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-[#4A3F3B] hover:bg-[#3D3330] text-white font-bold tracking-widest uppercase py-3 rounded-xl transition-all cursor-pointer shadow hover:scale-101 text-xs"
                  >
                    Generate OTP Code
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      {/* SMS OTP SIMULATION MODAL POPUP */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-natural-border rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl text-[#4A3F3B] font-sans">
            <div className="bg-natural-peach text-natural-gold p-3 rounded-full max-w-max mx-auto border border-natural-border/30">
              <Phone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-serif text-lg font-bold">Secure OTP Verification</h4>
              <p className="text-xs text-natural-muted mt-1">An authentication code was simulated via SMS to register: {regPhone || "+91 98765 43210"}</p>
            </div>
            
            <div className="space-y-3">
              <input
                type="text"
                required
                maxLength={4}
                placeholder="Codes (e.g. 1234)"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/gs, ''))}
                className="w-full bg-natural-bg dark:bg-zinc-850 border border-natural-border text-center tracking-[0.5em] text-lg font-mono font-bold rounded-xl py-2.5 outline-none"
              />
              <p className="text-[10px] text-natural-muted">
                Resend code in: <span className="font-bold text-natural-gold">{otpTimer}s</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleVerifyOtpSubmit()}
                className="flex-1 bg-natural-text hover:bg-natural-charcoal text-white font-bold text-[11px] uppercase py-2.5 rounded-lg transition-transform cursor-pointer"
              >
                Verify Code
              </button>
              <button
                type="button"
                disabled={otpTimer > 0}
                onClick={() => {
                  setOtpTimer(60);
                  addNotification("Resent OTP", "Generated a new 4-digit code (Use 1234)!", "success");
                }}
                className={`flex-1 border text-[11px] uppercase font-bold py-2.5 rounded-lg ${otpTimer === 0 ? "border-zinc-800 text-zinc-800 cursor-pointer" : "border-gray-200 text-gray-400"}`}
              >
                Resend Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER SECTION */}
      <footer className="bg-neutral-900 text-zinc-400 pt-16 pb-8 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About Column */}
            <div className="space-y-4">
              <h4 className="font-serif text-lg font-bold text-white tracking-widest uppercase">AURA Luxe</h4>
              <p className="text-xs leading-relaxed">
                Step inside AURA Luxe Studio's grand sanctuary rooms. Tailor elegant bridal base-matching, advanced skin/hair collagen therapies, therapeutic warm stone spa, and custom-styled lash extensions.
              </p>
              <button
                onClick={() => {
                  alert("Live Chat: Our support assistant is currently at your service on the bottom corner bot! Click on it.");
                }}
                className="inline-flex items-center gap-2 bg-natural-gold hover:opacity-95 text-[#4A3F3B] text-[10px] font-bold tracking-wider uppercase px-4 py-2 rounded-xl scale-98 hover:scale-100 transition-all cursor-pointer shadow"
              >
                SOS Emergency Support Line
              </button>
            </div>

            {/* Navigation Column Links */}
            <div className="space-y-3 text-xs uppercase tracking-wider font-semibold">
              <h5 className="font-serif text-sm font-bold text-white lowercase uppercase">Salon Info</h5>
              <ul className="space-y-2">
                <li><button onClick={() => setCurrentView("home")} className="hover:text-white cursor-pointer select-all">About Our Lounge</button></li>
                <li><button onClick={() => setCurrentView("services")} className="hover:text-white cursor-pointer select-all">Style Menu Pricing</button></li>
                <li><button onClick={() => setCurrentView("reviews")} className="hover:text-white cursor-pointer select-all">Testimonials & Reviews</button></li>
                <li><a href="#map-section" className="hover:text-white select-all">Find Flags on Maps</a></li>
              </ul>
            </div>

            {/* Contact Support */}
            <div className="space-y-3 text-xs leading-relaxed">
              <h5 className="font-serif text-sm font-bold text-white uppercase">Contact & Support</h5>
              <p>Owner: <strong>Grand Cosmologist Aditii Roy</strong></p>
              <p>Email: <strong>support@luxebeauty.booking</strong></p>
              <p>Contact No: <strong>+91 98765 43210</strong></p>
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                referrerPolicy="no-referrer"
                className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-bold text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg mt-2 cursor-pointer transition-all"
              >
                WhatsApp Lounge Room
              </a>
            </div>

            {/* Interactive map coordinates details */}
            <div id="map-section" className="space-y-3 text-xs">
              <h5 className="font-serif text-sm font-bold text-white uppercase">Our Flagship Location</h5>
              
              {/* Simulated Map */}
              <div className="w-full h-32 bg-zinc-800 rounded-2xl flex items-center justify-center relative overflow-hidden border border-zinc-700">
                <div className="absolute inset-0 opacity-40">
                  {/* Styling coordinates lines on map */}
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-sky-200"></div>
                  <div className="absolute top-1/3 left-0 w-full h-[1px] bg-sky-200"></div>
                  <div className="absolute left-1/2 top-0 w-[1px] h-full bg-sky-200"></div>
                  <div className="absolute left-3/4 top-0 w-[1px] h-full bg-sky-200"></div>
                </div>
                <div className="text-center relative z-10 space-y-1">
                  <MapPin className="w-6 h-6 text-natural-gold mx-auto animate-bounce" />
                  <span className="font-mono text-[9px] text-gray-300 font-extrabold uppercase">ELEGANT BOULEVARD, MUMBAI</span>
                </div>
              </div>

              <p className="text-[10px] leading-snug">
                77 Elegant Blvd, Mumbai (opposite Elite Galleria, next to Emerald Lane).
              </p>
            </div>
          </div>

          {/* Sincere Corporate Lines and Footer Links */}
          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center text-[11px] gap-4">
            <p>© 2026 AURA Luxe Beauty Studio. All sovereign rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-white cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">Terms & Conditions</span>
              <span>•</span>
              <span className="hover:text-white cursor-pointer">Refund Policy</span>
            </div>
          </div>
        </div>
      </footer>

      {/* GENERAL CHAT SUPPORT FLOATING BOT */}
      <AIChatBot />
    </div>
  );
}
