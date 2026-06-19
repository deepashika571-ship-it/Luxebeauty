import React, { useState, useEffect } from "react";
import { Check, CreditCard, Landmark, Smartphone, PiggyBank, DollarSign, Download, Printer, Percent, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Booking, PaymentMethod, PaymentStatus } from "../types";
import { DEFAULT_SERVICES } from "../services";

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
    const updatedBooking: Booking = {
      ...booking,
      paymentMethod,
      paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
      status: "confirmed",
      invoiceId,
      servicePrice: finalTotal,
    };

    setIsProcessing(false);
    setIsCompleted(true);
    setInvoiceReady(updatedBooking);

    // Trigger success callback
    onPaymentSuccess(paymentMethod, paymentMethod === "cash" ? "pending" : "paid", updatedBooking);
  };

  const handlePrint = () => {
    window.print();
  };

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
              <p className="text-xs text-zinc-500">support@luxebeauty.booking</p>
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

          {/* Payment Method Icons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("upi")}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                paymentMethod === "upi"
                  ? "border-pink-500 bg-pink-50/50 dark:bg-rose-950/20 text-pink-600 dark:text-rose-450"
                  : "border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <Smartphone className="w-4 h-4 shrink-0 text-pink-500" />
              UPI App
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                paymentMethod === "card"
                  ? "border-pink-500 bg-pink-50/50 dark:bg-rose-950/20 text-pink-600 dark:text-rose-450"
                  : "border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0 text-amber-500" />
              Debit / Credit
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("netbanking")}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                paymentMethod === "netbanking"
                  ? "border-pink-500 bg-pink-50/50 dark:bg-rose-950/20 text-pink-600 dark:text-rose-450"
                  : "border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <Landmark className="w-4 h-4 shrink-0 text-blue-500" />
              NetBanking
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                paymentMethod === "cash"
                  ? "border-pink-500 bg-pink-50/50 dark:bg-rose-950/20 text-pink-600 dark:text-rose-450"
                  : "border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 text-gray-600 dark:text-gray-300"
              }`}
            >
              <PiggyBank className="w-4 h-4 shrink-0 text-emerald-500" />
              Pay at Salon
            </button>
          </div>

          {/* Dynamic input areas */}
          {paymentMethod === "upi" && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-750 space-y-3">
              <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider">UPI Phone Number ID / VPA</label>
              <input
                type="text"
                required
                placeholder="e.g. name@okhdfcbank or 9876543210@paytm"
                value={upiPhone}
                onChange={(e) => setUpiPhone(e.target.value)}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-pink-400"
              />
              <div className="flex gap-3 justify-center items-center py-2">
                <div className="bg-white p-2.5 rounded-lg border border-zinc-100 shadow-sm flex flex-col items-center">
                  {/* Luxury Mocking QR Code */}
                  <div className="w-24 h-24 bg-zinc-200 flex items-center justify-center rounded-md font-mono text-[9px] text-gray-400 border border-gray-300">
                    <div className="grid grid-cols-3 gap-0.5 w-[85%] h-[85%] bg-white p-1">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className={`border border-zinc-800 ${i % 2 === 0 ? "bg-zinc-800" : "bg-white"}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-500 font-mono tracking-widest mt-1.5 uppercase">SCAN FOR UPI</span>
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-750">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider">Cardholder Name</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name Listed on Card"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-pink-400"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider">Card Number</label>
                <input
                  type="text"
                  required
                  maxLength={19}
                  placeholder="4111 2222 3333 4444"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                  className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-pink-400 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-pink-400 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider">CVV Code</label>
                  <input
                    type="password"
                    required
                    maxLength={3}
                    placeholder="345"
                    value={cardCVV}
                    onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-pink-400 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === "netbanking" && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-750">
              <label className="block text-xs font-semibold uppercase text-zinc-500 tracking-wider mb-2">Select Banking Institution</label>
              <select className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-pink-400">
                <option>HDFC Luxury Banking Private</option>
                <option>ICICI Bank Premium Suites</option>
                <option>State Bank of India Gold</option>
                <option>Axis Royal Privilege</option>
              </select>
            </div>
          )}

          {paymentMethod === "cash" && (
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-dashed border-emerald-200 dark:border-emerald-900 rounded-2xl p-4 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
              <p className="font-semibold">Pay at Lounge Option Selected</p>
              No payment is required right now. Double click below to confirm your booking and secure the time slot. Standard cash, card, and UPI terminal available when checking out at the salon lobby.
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
