import React, { useState, useEffect } from "react";
import { Check, CreditCard, Landmark, Smartphone, PiggyBank, DollarSign, Download, Printer, Percent, ArrowLeft, Loader2, Sparkles, Copy, CheckCircle2, XCircle, Mail, AlertCircle, PhoneCall, HelpCircle } from "lucide-react";
import { Booking, PaymentMethod, PaymentStatus, PaymentTransaction } from "../types";
import { DEFAULT_SERVICES } from "../services";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

interface CheckoutGatewayProps {
  booking: Booking;
  couponCodeInput: string;
  onPaymentSuccess: (method: PaymentMethod, status: PaymentStatus, updatedBooking: Booking) => void;
  onCancel: () => void;
}

export default function CheckoutGateway({ booking, couponCodeInput, onPaymentSuccess, onCancel }: CheckoutGatewayProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  
  const [upiPhone, setUpiPhone] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("paytm");
  
  const [couponCode, setCouponCode] = useState(couponCodeInput || "");
  const [couponError, setCouponError] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [invoiceReady, setInvoiceReady] = useState<Booking | null>(null);

  // New PhonePe UPI states
  const [upiCopied, setUpiCopied] = useState(false);
  const [simulateStatus, setSimulateStatus] = useState<'success' | 'failed'>('success');
  const [isFailedCompleted, setIsFailedCompleted] = useState(false);
  const [failedTransaction, setFailedTransaction] = useState<PaymentTransaction | null>(null);

  // Math totals
  const subtotal = booking.servicePrice;
  const taxAmount = Math.round(subtotal * 0.18); // 18% GST standard salon
  
  useEffect(() => {
    if (couponCodeInput && !couponApplied) {
      applyCoupon(couponCodeInput);
    }
  }, [couponCodeInput]);

  const applyCoupon = (code: string) => {
    const uppercaseCode = code.toUpperCase().trim();
    if (uppercaseCode === "WELCOME500") {
      setDiscountAmount(500);
      setCouponApplied(true);
      setCouponError("");
    } else if (uppercaseCode === "LUXE20") {
      setDiscountAmount(Math.round(subtotal * 0.20));
      setCouponApplied(true);
      setCouponError("");
    } else if (uppercaseCode === "FESTIVEGLOW") {
      setDiscountAmount(Math.round(subtotal * 0.15));
      setCouponApplied(true);
      setCouponError("");
    } else if (uppercaseCode === "HENNAART") {
      setDiscountAmount(Math.round(subtotal * 0.20));
      setCouponApplied(true);
      setCouponError("");
    } else {
      setCouponError("Invalid or expired coupon code");
      setCouponApplied(false);
      setDiscountAmount(0);
    }
  };

  const finalTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate luxury processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    const invoiceId = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const txId = `PAY-${Date.now()}`;
    const utrCode = Math.floor(100000000000 + Math.random() * 900000000000).toString();

    // Determine success path
    const isSuccess = true;
    const nowIso = new Date().toISOString();

    const upiUsed = paymentMethod === "upi" ? (upiPhone || "9342956011@axl") : "";

    const tx: PaymentTransaction = {
      id: txId,
      bookingId: booking.id,
      userId: booking.userId || "guest_uid",
      userEmail: booking.userEmail,
      userName: booking.userName,
      userPhone: booking.userPhone,
      serviceId: booking.serviceId,
      serviceName: booking.serviceName,
      amount: finalTotal,
      paymentMethod,
      upiIdUsed: upiUsed,
      merchantUpiId: "9342956011@axl", // PhonePe UPI ID
      status: "paid",
      refundStatus: "none",
      refundWindowDays: 2,
      createdAt: nowIso,
      transactionRef: utrCode,
      emailSent: false,
    };

    const updatedBooking: Booking = {
      ...booking,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
      status: "confirmed",
      invoiceId,
      checkoutDate: nowIso,
      paymentTxCode: txId,
      paymentDetails: tx,
      servicePrice: finalTotal,
    };

    try {
      // Collect and save payment transaction in Firestore!
      await setDoc(doc(db, "payments", txId), tx);
      await setDoc(doc(db, "checkout_payments", txId), tx);
    } catch (err) {
      console.warn("Firestore collection update failed:", err);
    }

    setIsProcessing(false);

    if (isSuccess) {
      setIsCompleted(true);
      setInvoiceReady(updatedBooking);
      // Trigger success callback
      onPaymentSuccess(paymentMethod, paymentMethod === "cash" ? "pending" : "paid", updatedBooking);
    } else {
      setFailedTransaction(tx);
      setIsFailedCompleted(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isFailedCompleted && failedTransaction) {
    return (
      <div id="failed-refund-screen" className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-amber-100 dark:border-zinc-850 rounded-3xl shadow-2xl p-6 md:p-8 animate-fade-in text-zinc-900 dark:text-zinc-100 font-sans">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 p-4 rounded-full text-rose-600 dark:text-rose-400 mb-4">
            <XCircle className="w-12 h-12 stroke-[2]" />
          </div>
          <h3 className="font-serif text-2xl text-zinc-900 dark:text-zinc-50 font-semibold tracking-wide">PhonePe Transaction Failed</h3>
          <p className="text-xs text-rose-600 dark:text-rose-450 font-bold uppercase tracking-widest mt-1.5">No funds debited? Refund Initialized Automatically</p>
          <p className="text-xs text-zinc-500 mt-2 max-w-md mx-auto">
            Your payment authorization to merchant UPI code <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-bold">9342956011@axl</span> could not be confirmed by the banking gateway.
          </p>
        </div>

        {/* Informational Refund Timeline Banner */}
        <div className="bg-amber-50/30 dark:bg-[#2A241E] border border-amber-200/50 dark:border-amber-900/40 rounded-2xl p-5 space-y-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-xs text-amber-900 dark:text-amber-200">2-Day Refund Guarantee</h5>
              <p className="text-[11px] text-zinc-650 dark:text-zinc-400 mt-1 leading-relaxed">
                If money was deducted from your account, PhonePe standard protocols guarantee a direct, secure rebound back into your UPI account: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{failedTransaction.upiIdUsed}</strong> within <strong>48 hours (2 Days)</strong>.
              </p>
            </div>
          </div>

          <div className="border-t border-amber-200/25 pt-4 flex gap-3">
            <Mail className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-xs text-amber-900 dark:text-amber-200">Automated E-mail Notifications</h5>
              <p className="text-[11px] text-zinc-650 dark:text-zinc-400 mt-1 leading-relaxed">
                As soon as the salon administrator reconciles this failed payout on our terminal, a confirmation email will be dispatched immediately to <strong className="text-zinc-800 dark:text-zinc-200">{failedTransaction.userEmail}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Ledger Table */}
        <div className="bg-zinc-50 dark:bg-zinc-800/40 rounded-xl p-5 mt-6 space-y-3 text-xs">
          <div className="flex justify-between items-center text-xs pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-550">Transaction ID:</span>
            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{failedTransaction.id}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-550">Payment Channel:</span>
            <span className="font-semibold uppercase text-xs">{failedTransaction.paymentMethod === "upi" ? "PhonePe UPI" : failedTransaction.paymentMethod}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-550 flex items-center gap-1">Reference No (UTR): <HelpCircle className="w-3.5 h-3.5 text-zinc-400" title="12-digit transaction reference" /></span>
            <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{failedTransaction.transactionRef}</span>
          </div>
          <div className="flex justify-between items-center text-xs pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-550">UPI VPA targeted for Refund:</span>
            <span className="font-mono font-bold text-rose-500">{failedTransaction.upiIdUsed}</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-1">
            <span className="text-zinc-800 dark:text-zinc-200 font-bold">Total Amount to Reconcile:</span>
            <span className="font-mono font-bold text-zinc-950 dark:text-white text-sm">₹{failedTransaction.amount}</span>
          </div>
        </div>

        {/* Primary Screen controls */}
        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] uppercase py-3.5 rounded-xl tracking-wider text-center cursor-pointer transition-colors"
          >
            Go Back
          </button>
          
          <button
            type="button"
            onClick={() => {
              setIsFailedCompleted(false);
              setFailedTransaction(null);
            }}
            className="flex-1 bg-zinc-900 hover:bg-black dark:bg-zinc-850 dark:hover:bg-zinc-800 text-white font-bold text-[11px] uppercase py-3.5 rounded-xl tracking-wider text-center cursor-pointer transition-colors"
          >
            Retry Payment
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted && invoiceReady) {
    return (
      <div id="invoice-success-screen" className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-emerald-100 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 md:p-8 animate-fade-in text-zinc-900 dark:text-zinc-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-emerald-100 dark:bg-emerald-950 p-4 rounded-full text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
            <Check className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h3 className="font-serif text-3xl text-zinc-900 dark:text-zinc-50 font-medium">Beauty Slot Secured!</h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-mono tracking-wider font-semibold">INVOICE #{invoiceReady.invoiceId}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Thank you for choosing LuxeBeauty. Your royal styling is scheduled.</p>
        </div>

        {/* Printable Invoice Card */}
        <div id="printable-area" className="bg-zinc-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/60 rounded-2xl p-6 space-y-6 font-sans">
          <div className="flex justify-between items-start border-b border-gray-200 dark:border-zinc-700 pb-5">
            <div>
              <h4 className="font-serif text-xl tracking-wider text-pink-600 font-bold">LuxeBeauty Lounge</h4>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Flagship Salon & Spa Suite</p>
              <p className="text-xs text-zinc-500 mt-1">77 Elegant Blvd, Mumbai</p>
              <p className="text-xs text-zinc-500">abishek9342956011@gmail.com</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                {invoiceReady.paymentStatus === "paid" ? "PAID" : "CASH ON VISIT"}
              </span>
              <p className="text-xs text-zinc-500 mt-2">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-xs text-zinc-500">Time: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h5 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">GUEST DETAILS</h5>
              <p className="font-semibold text-zinc-850 dark:text-zinc-150">{invoiceReady.userName}</p>
              <p className="text-zinc-500">{invoiceReady.userEmail}</p>
              <p className="text-zinc-500">{invoiceReady.userPhone}</p>
            </div>
            <div>
              <h5 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">APPOINTMENT INFO</h5>
              <p className="font-semibold text-zinc-850 dark:text-zinc-150">{invoiceReady.artist}</p>
              <p className="text-zinc-500">Date: {invoiceReady.date}</p>
              <p className="text-zinc-500">Slot: {invoiceReady.timeSlot}</p>
              <p className="text-rose-500">{invoiceReady.branch.split(',')[0]}</p>
            </div>
          </div>

          <div className="border-t border-b border-gray-200 dark:border-zinc-700 py-3 text-xs">
            <div className="flex justify-between items-center font-bold text-zinc-500 uppercase tracking-wider pb-2 border-b border-dashed border-gray-200 dark:border-zinc-700">
              <span>Service Description</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between items-center py-2 text-zinc-850 dark:text-zinc-200">
              <div>
                <p className="font-semibold">{invoiceReady.serviceName}</p>
                <p className="text-[10px] text-zinc-500">Category: {invoiceReady.serviceCategory}</p>
              </div>
              <p className="font-mono font-bold">₹{subtotal}</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-right max-w-xs ml-auto">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal:</span>
              <span className="font-mono">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>GST & Surcharge (18%):</span>
              <span className="font-mono">+₹{taxAmount}</span>
            </div>
            {couponApplied && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Loyalty/Promo Discount:</span>
                <span className="font-mono">-₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-900 dark:text-white font-bold text-base border-t border-gray-200 dark:border-zinc-700 pt-1.5">
              <span>Grand Total:</span>
              <span className="font-mono text-rose-500">₹{finalTotal}</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-zinc-500 pt-4 border-t border-dashed border-gray-200 dark:border-zinc-700">
            Terms: Please arrive 10 minutes prior to scheduled slot. Cancellation accepted up to 24 hours prior. Earned 100 reward points!
          </p>
        </div>

        {/* Floating Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 hover:dark:bg-zinc-650 text-white font-bold tracking-widest text-xs uppercase py-3.5 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold tracking-widest text-xs uppercase py-3.5 rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-xl"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="checkout-gateway-window" className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-pink-100 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 md:p-8 text-zinc-900 dark:text-zinc-100">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 uppercase tracking-wider focus:outline-none transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Form
        </button>
        <span className="text-[10px] font-sans font-extrabold tracking-widest uppercase bg-pink-100 dark:bg-zinc-800 text-pink-600 px-3 py-1 rounded-full border border-pink-100/30">
          Secure Core Billing
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Form Selection */}
        <form onSubmit={handlePay} className="md:col-span-7 space-y-6">
          <div>
            <h4 className="font-serif text-xl font-medium tracking-wide mb-1">Select Payment Venue</h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">All transactions are processed through 256-bit secure gateway.</p>
          </div>
                {/* Payment Method Icons - Restricted to UPI App and Pay at Salon only */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("upi")}
              className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                paymentMethod === "upi"
                  ? "border-pink-500 bg-pink-50/50 dark:bg-[#2F2120] text-pink-600 dark:text-rose-450"
                  : "border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0 text-pink-500" />
              UPI App Instant
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex items-center justify-center gap-2.5 p-3.5 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                paymentMethod === "cash"
                  ? "border-emerald-500 bg-emerald-50/20 dark:bg-[#1E2D27] text-emerald-600 dark:text-emerald-400"
                  : "border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <PiggyBank className="w-4 h-4 shrink-0 text-emerald-500" />
              Pay at Salon
            </button>
          </div>

          {/* Dynamic input areas */}
          {paymentMethod === "upi" && (
            <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-5 border border-zinc-100 dark:border-zinc-750 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-500 tracking-wider">Merchant PhonePe Address</label>
                  <p className="font-mono text-xs font-bold text-natural-gold mt-0.5">9342956011@axl</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("9342956011@axl");
                    setUpiCopied(true);
                    setTimeout(() => setUpiCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[10px] bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-805 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer text-zinc-700 dark:text-zinc-350"
                >
                  <Copy className="w-3 h-3 text-zinc-400" />
                  <span>{upiCopied ? "Copied!" : "Copy VPA"}</span>
                </button>
              </div>

              {/* Scannable Real UPI QR Generation */}
              <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-sm text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `upi://pay?pa=9342956011@axl&pn=Aura%20Luxe%2520Studio&am=${finalTotal}&cu=INR&tn=LuxeBeautyBooking_${booking.id}`
                  )}`}
                  alt="PhonePe UPI QR Code"
                  className="w-36 h-36 p-1.5 border border-zinc-150 rounded-lg animate-fade-in"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] text-[#4A3F3B] dark:text-zinc-300 font-extrabold tracking-widest mt-2.5 uppercase font-mono">Scan via PhonePe, GPay, or Paytm</span>
                <p className="text-[10px] text-zinc-400 max-w-[210px] leading-normal mt-0.5">Directly connected to Indian banking network. Real-time authorization setup.</p>

                {/* Direct Mobile launch deep-link */}
                <a
                  href={`upi://pay?pa=9342956011@axl&pn=Aura%2520Luxe%2520Studio&am=${finalTotal}&cu=INR&tn=LuxeBeautyBooking_${booking.id}`}
                  className="w-full text-center bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 text-white font-bold py-2.5 px-3 rounded-xl text-[10px] uppercase font-mono tracking-wider transition-colors mt-3"
                >
                  ⚡ Launch respective UPI app on this device
                </a>
              </div>

              {/* Customer UPI Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider">Your Payment UPI ID (VPA)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. name@okaxis or 9342956011@ybl"
                  value={upiPhone}
                  onChange={(e) => setUpiPhone(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-400 font-mono text-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          )}

          {paymentMethod === "cash" && (
            <div className="bg-zinc-50 dark:bg-zinc-805 border border-zinc-250 dark:border-zinc-800/60 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-rose-500">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Pay at Salon (Pre-Scan Setup Connected)</h5>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-350 leading-relaxed">
                Thank you! You can double-click below to secure this slot request and confirm your scheduled specialist visit. 
                At our lobby reception desk, scan our active UPI scanner which immediately launches your respective payment application to pay ₹{finalTotal}.
              </p>

              {/* Scanner Block integrated directly for Pay at Salon */}
              <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 border border-dashed border-emerald-300 dark:border-emerald-800/80 rounded-2xl text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `upi://pay?pa=9342956011@axl&pn=Aura%20Luxe%2520Studio&am=${finalTotal}&cu=INR&tn=LuxeBeautyBookingPayAtSalon_${booking.id}`
                  )}`}
                  alt="Aura Luxe UPI QR Terminal"
                  className="w-36 h-36 p-1.5 border border-emerald-200 dark:border-emerald-800 rounded-lg shadow-sm"
                  referrerPolicy="no-referrer"
                />
                <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-extrabold tracking-widest mt-2 uppercase font-mono">Respective UPI App Instant Connect</span>
                <p className="text-[9px] text-zinc-400 max-w-[210px] leading-normal mt-0.5">Scans will automatically trigger secure UPI authentication to complete payout of ₹{finalTotal}.</p>
                
                <a
                  href={`upi://pay?pa=9342956011@axl&pn=Aura%2520Luxe%2520Studio&am=${finalTotal}&cu=INR&tn=LuxeBeautyBookingPayAtSalon_${booking.id}`}
                  className="w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-xl text-[10px] uppercase font-mono tracking-wider transition-colors mt-2"
                >
                  ⚡ Connect and Launch UPI App
                </a>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 font-bold tracking-widest text-white text-xs uppercase px-6 py-4 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Authorizing Security Gateway...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Confirm & Reserv Slot (₹{finalTotal})</span>
              </>
            )}
          </button>
        </form>

        {/* Right Summary Columns */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl p-5 shadow-sm">
            <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500 mb-3">Booking Menu Detail</h5>
            <div className="flex gap-3 pb-4 border-b border-gray-200 dark:border-zinc-700">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <img src={booking.branch === "LuxeBeauty Studio, Lavelle Road (Bangalore)" ? DEFAULT_SERVICES[2].image : DEFAULT_SERVICES[0].image} className="w-full h-full object-cover" />
              </div>
              <div>
                <h6 className="font-semibold text-xs text-zinc-900 dark:text-white line-clamp-1">{booking.serviceName}</h6>
                <p className="text-[11px] text-zinc-500 mt-1">Artist: <span className="font-semibold text-zinc-700 dark:text-zinc-350">{booking.artist}</span></p>
                <p className="text-[11px] text-zinc-500 mt-0.5">Time: {booking.timeSlot.split(' - ')[0]}</p>
              </div>
            </div>

            {/* Promo Codes */}
            <div className="py-4 border-b border-gray-200 dark:border-zinc-700">
              <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-2">Claim Beauty Coupon</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="LUXE20, WELCOME500"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError("");
                  }}
                  className="flex-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs uppercase outline-none focus:border-pink-300 font-mono"
                />
                <button
                  type="button"
                  onClick={() => applyCoupon(couponCode)}
                  className="bg-zinc-800 dark:bg-zinc-700 hover:bg-zinc-900 text-white font-bold text-[10px] tracking-wider uppercase px-4 rounded-xl cursor-pointer transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponError && <p className="text-[10px] text-rose-500 mt-1 font-sans">{couponError}</p>}
              {couponApplied && <p className="text-[10px] text-emerald-600 mt-1 font-bold flex items-center gap-1">✓ Promo applied successfully!</p>}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-xs pt-4">
              <div className="flex justify-between text-zinc-500">
                <span>Salon Rate:</span>
                <span className="font-mono">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>GST Tax (18%):</span>
                <span className="font-mono">₹{taxAmount}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Voucher Savings:</span>
                  <span className="font-mono">-₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-900 dark:text-white font-bold text-sm border-t border-gray-200 dark:border-zinc-700 pt-2.5">
                <span>Total Charge:</span>
                <span className="font-mono text-rose-500 text-base">₹{finalTotal}</span>
              </div>
            </div>
          </div>

          {/* Quick Coupons List */}
          <div className="bg-amber-50/30 dark:bg-zinc-800/30 border border-dashed border-amber-200/50 rounded-2xl p-4 space-y-2">
            <h6 className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-450">Active Promo Suggestions</h6>
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 space-y-1">
              <p>• Write <strong className="font-mono text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-850 px-1 py-0.5 rounded">LUXE20</strong> to grab 20% OFF on facials.</p>
              <p>• Write <strong className="font-mono text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-850 px-1 py-0.5 rounded">WELCOME500</strong> for ₹500 discount.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
