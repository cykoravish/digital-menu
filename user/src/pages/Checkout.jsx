"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, CreditCard, Banknote, User, Phone, MapPin, MessageSquare } from "lucide-react"
import { useCart } from "../contexts/CartContext"
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
  const [razorpayLoaded, setRazorpayLoaded] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => setRazorpayLoaded(true)
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

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

  const handleRazorpayPayment = async (orderData) => {
    try {
      // Create Razorpay order
      const paymentResponse = await axios.post(`${import.meta.env.VITE_BACKEND_API}/orders/create-payment`, {
        amount: getTotalPrice(),
      })

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_your_key_id",
        amount: paymentResponse.data.order.amount,
        currency: paymentResponse.data.order.currency,
        name: "Restaurant Order",
        description: "Order Payment",
        order_id: paymentResponse.data.order.id,
        handler: async (response) => {
          try {
            // First create the order
            const orderResponse = await axios.post(`${import.meta.env.VITE_BACKEND_API}/orders`, orderData)
            const order = orderResponse.data.order

            // Then verify payment
            await axios.post(`${import.meta.env.VITE_BACKEND_API}/orders/verify-payment`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id,
            })

            clearCart()
            toast.success("Payment successful! Order placed.")
            navigate(`/order/${order._id}`)
          } catch (error) {
            toast.error("Payment verification failed")
          }
        },
        prefill: {
          name: formData.customerName,
          contact: formData.customerPhone,
        },
        theme: {
          color: "#ea580c",
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", (response) => {
        toast.error("Payment failed. Please try again.")
      })
      rzp.open()
    } catch (error) {
      toast.error("Failed to initiate payment")
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
        if (!razorpayLoaded) {
          toast.error("Payment system is loading. Please try again.")
          setLoading(false)
          return
        }
        await handleRazorpayPayment(orderData)
      } else {
        // Cash payment - create order directly
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_API}/orders`, orderData)
        const order = response.data.order

        clearCart()
        toast.success("Order placed successfully!")
        navigate(`/order/${order._id}`)
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBack}
            className="btn-primary"
          >
            Back to Menu
          </motion.button>
        </div>
      </div>
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
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={formData.paymentMethod === "upi"}
                onChange={handleChange}
                className="sr-only"
              />
              <CreditCard className="w-6 h-6 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">UPI Payment</p>
                <p className="text-sm text-gray-600">Pay instantly with UPI</p>
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
    </div>
  )
}

export default Checkout
