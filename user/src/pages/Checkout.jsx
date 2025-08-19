"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  User,
  Phone,
  MapPin,
  MessageSquare,
  Smartphone,
  Monitor,
  Copy,
  CheckCircle,
} from "lucide-react"
import { useCart } from "../contexts/CartContext"
import AdBanner from "../components/AdBanner"
import axios from "axios"
import { toast } from "react-hot-toast"

const Checkout = () => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  const { cartItems, getTotalPrice, clearCart } = useCart()

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    tableNumber: "",
    paymentMethod: "cash",
    specialInstructions: "",
  })

  const [loading, setLoading] = useState(false)
  const [restaurant, setRestaurant] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [showUpiInstructions, setShowUpiInstructions] = useState(false)
  const [copiedField, setCopiedField] = useState("")

  const searchParams = new URLSearchParams(window.location.search)
  const isFromTracking = searchParams.get("from") === "tracking"
  const originalOrderId = searchParams.get("originalOrder")

  const isValidUPI = (upiId) => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
    return upiRegex.test(upiId)
  }

  const generateUPILink = (payeeVPA, payeeName, amount, transactionNote, transactionRef) => {
    const params = new URLSearchParams({
      pa: payeeVPA,
      pn: payeeName,
      am: amount.toString(),
      cu: "INR",
      tn: transactionNote,
    })

    if (transactionRef) {
      params.append("tr", transactionRef)
    }

    return `upi://pay?${params.toString()}`
  }

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success(`${field} copied to clipboard!`)
      setTimeout(() => setCopiedField(""), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/restaurants/${restaurantId}`)
        setRestaurant(response.data.restaurant)
      } catch (error) {
        console.error("Failed to fetch restaurant details:", error)
      }
    }

    fetchRestaurant()
  }, [restaurantId])

  useEffect(() => {
    console.log("[v0] Checkout page loaded:", {
      restaurantId,
      cartItemsCount: cartItems.length,
      cartItems: cartItems.map((item) => ({ name: item.name, quantity: item.quantity })),
    })
  }, [restaurantId, cartItems])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      })
    }
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.customerName.trim()) {
      errors.customerName = "Name is required"
    }

    if (!formData.customerPhone.trim()) {
      errors.customerPhone = "Phone number is required"
    } else if (!/^[6-9]\d{9}$/.test(formData.customerPhone.trim())) {
      errors.customerPhone = "Please enter a valid 10-digit Indian phone number"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpiPayment = async (orderData) => {
    try {
      if (!restaurant?.upiDetails?.isUpiEnabled || !restaurant?.upiDetails?.upiId) {
        toast.error("UPI payment is not available for this restaurant")
        return
      }

      // Validate UPI ID
      if (!isValidUPI(restaurant.upiDetails.upiId)) {
        toast.error("Invalid UPI ID configured for this restaurant")
        return
      }

      // First create the order with pending payment status
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_API}/orders`, {
        ...orderData,
        paymentStatus: "pending",
      })
      const order = response.data.order

      const upiLink = generateUPILink(
        restaurant.upiDetails.upiId,
        restaurant.upiDetails.merchantName || restaurant.name,
        getTotalPrice(),
        `Order #${order.orderNumber} - ${restaurant.name}`,
        order.orderNumber,
      )

      if (!isMobile()) {
        setShowUpiInstructions(true)
        toast.success("Order placed successfully! Please complete the UPI payment.", {
          duration: 5000,
        })
      } else {
        try {
          // Try to open UPI app
          window.location.href = upiLink

          toast.success("Opening UPI app... Please complete the payment", {
            duration: 5000,
          })

          setTimeout(() => {
            if (!document.hidden) {
              setShowUpiInstructions(true)
              toast.info("If UPI app didn't open, use the payment details below", {
                duration: 8000,
              })
            }
          }, 3000)
        } catch (error) {
          console.error("Failed to open UPI app:", error)
          setShowUpiInstructions(true)
          toast.error("Failed to open UPI app. Please use the payment details below.")
        }
      }

      clearCart()

      // Navigate to order tracking
      if (isFromTracking) {
        window.open(`/order/${order._id}`, "_blank")
        navigate(`/order/${originalOrderId}`)
      } else {
        navigate(`/order/${order._id}`)
      }

      window.upiPaymentDetails = {
        upiId: restaurant.upiDetails.upiId,
        merchantName: restaurant.upiDetails.merchantName || restaurant.name,
        amount: getTotalPrice(),
        orderNumber: order.orderNumber,
        upiLink: upiLink,
      }
    } catch (error) {
      console.error("UPI payment error:", error)
      const errorMessage = error.response?.data?.message || "Failed to create order"
      toast.error(errorMessage)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly")
      return
    }

    setLoading(true)

    try {
      const orderData = {
        restaurantId,
        items: cartItems.map((item) => ({
          dishId: item._id,
          quantity: item.quantity,
        })),
        ...formData,
      }

      if (formData.paymentMethod === "upi") {
        await handleUpiPayment(orderData)
      } else {
        // Cash payment - create order directly
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_API}/orders`, orderData)
        const order = response.data.order

        clearCart()
        toast.success("Order placed successfully!")

        if (isFromTracking) {
          window.open(`/order/${order._id}`, "_blank")
          navigate(`/order/${originalOrderId}`)
        } else {
          navigate(`/order/${order._id}`)
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to place order"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate(`/menu/${restaurantId}`)
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">Add some items to your cart before checkout</p>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBack}
              className="btn-primary block w-full"
            >
              Back to Menu
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Go Back
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  const UpiInstructionsModal = () => {
    if (!showUpiInstructions || !window.upiPaymentDetails) return null

    const { upiId, merchantName, amount, orderNumber, upiLink } = window.upiPaymentDetails

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={() => setShowUpiInstructions(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {isMobile() ? (
                <Smartphone className="w-8 h-8 text-orange-600" />
              ) : (
                <Monitor className="w-8 h-8 text-orange-600" />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Complete UPI Payment</h3>
            <p className="text-gray-600">
              {isMobile()
                ? "Use any UPI app to complete your payment"
                : "Scan QR code or use UPI ID on your mobile device"}
            </p>
          </div>

          <div className="space-y-4">
            {/* UPI ID */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <span className="font-mono text-sm text-gray-900 break-all">{upiId}</span>
                <button
                  onClick={() => copyToClipboard(upiId, "UPI ID")}
                  className="ml-2 p-2 text-gray-500 hover:text-orange-600 transition-colors"
                >
                  {copiedField === "UPI ID" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <span className="text-2xl font-bold text-orange-600">₹{amount}</span>
                <button
                  onClick={() => copyToClipboard(amount.toString(), "Amount")}
                  className="ml-2 p-2 text-gray-500 hover:text-orange-600 transition-colors"
                >
                  {copiedField === "Amount" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Reference */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
              <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                <span className="font-medium text-gray-900">Order #{orderNumber}</span>
                <button
                  onClick={() => copyToClipboard(`Order #${orderNumber}`, "Reference")}
                  className="ml-2 p-2 text-gray-500 hover:text-orange-600 transition-colors"
                >
                  {copiedField === "Reference" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              {isMobile() && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    window.location.href = upiLink
                    setShowUpiInstructions(false)
                  }}
                  className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                >
                  Open UPI App
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUpiInstructions(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                I'll Pay Later
              </motion.button>
            </div>

            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                After payment, your order status will be updated automatically.
                <br />
                Contact restaurant if payment doesn't reflect within 5 minutes.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </motion.button>
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Order Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    ₹{item.price} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-orange-600">₹{getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Customer Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className={`input w-full ${formErrors.customerName ? "border-red-500" : ""}`}
                placeholder="Enter your name"
                required
              />
              {formErrors.customerName && <p className="text-red-500 text-sm mt-1">{formErrors.customerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                className={`input w-full ${formErrors.customerPhone ? "border-red-500" : ""}`}
                placeholder="Enter your phone number"
                required
              />
              {formErrors.customerPhone && <p className="text-red-500 text-sm mt-1">{formErrors.customerPhone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Table Number (Optional)
              </label>
              <input
                type="text"
                name="tableNumber"
                value={formData.tableNumber}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., Table 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Special Instructions (Optional)
              </label>
              <textarea
                name="specialInstructions"
                value={formData.specialInstructions}
                onChange={handleChange}
                rows={3}
                className="textarea w-full"
                placeholder="Any special requests or dietary requirements..."
              />
            </div>
          </form>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h2>
          <div className="space-y-3">
            <motion.label
              whileHover={{ scale: 1.02 }}
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                formData.paymentMethod === "cash"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={formData.paymentMethod === "cash"}
                onChange={handleChange}
                className="sr-only"
              />
              <Banknote className="w-6 h-6 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Pay with Cash</p>
                <p className="text-sm text-gray-600">Pay when your order arrives</p>
              </div>
            </motion.label>

            <motion.label
              whileHover={{ scale: 1.02 }}
              className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                formData.paymentMethod === "upi"
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${!restaurant?.upiDetails?.isUpiEnabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={formData.paymentMethod === "upi"}
                onChange={handleChange}
                disabled={!restaurant?.upiDetails?.isUpiEnabled}
                className="sr-only"
              />
              <CreditCard className="w-6 h-6 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">UPI Payment</p>
                <p className="text-sm text-gray-600">
                  {restaurant?.upiDetails?.isUpiEnabled
                    ? "Pay directly to restaurant via UPI"
                    : "UPI payment not available"}
                </p>
              </div>
            </motion.label>
          </div>
        </motion.div>

        {/* Place Order Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Placing Order..." : `Place Order • ₹${getTotalPrice().toFixed(2)}`}
        </motion.button>
      </div>

      {/* AdBanner for checkout page to show ads for free plan restaurants */}
      <AdBanner restaurantId={restaurantId} placement="checkout" />

      <UpiInstructionsModal />
    </div>
  )
}

export default Checkout
