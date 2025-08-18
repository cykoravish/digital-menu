"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams } from "react-router-dom"
import {
  CheckCircle,
  Clock,
  ChefHat,
  Package,
  Truck,
  MapPin,
  Phone,
  User,
  Receipt,
  Download,
  X,
  AlertTriangle,
} from "lucide-react"
import axios from "axios"
import io from "socket.io-client"
import { toast } from "react-hot-toast"
import jsPDF from "jspdf"

const OrderTracking = () => {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    fetchOrder()
    setupSocket()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/orders/${orderId}`)
      setOrder(response.data.order)
    } catch (error) {
      console.error("Error fetching order:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupSocket = () => {
    const newSocket = io(import.meta.env.VITE_BACKEND_API)
    setSocket(newSocket)

    newSocket.emit("join-order", orderId)

    newSocket.on("order-status-updated", (updatedOrder) => {
      setOrder(updatedOrder)
    })
  }

  const getStatusSteps = () => {
    const steps = [
      { key: "pending", label: "Order Placed", icon: CheckCircle },
      { key: "accepted", label: "Order Accepted", icon: Clock },
      { key: "preparing", label: "Preparing", icon: ChefHat },
      { key: "ready", label: "Ready", icon: Package },
      { key: "completed", label: "Completed", icon: Truck },
    ]

    const currentIndex = steps.findIndex((step) => step.key === order?.orderStatus)
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }))
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "accepted":
        return "text-blue-600 bg-blue-100"
      case "preparing":
        return "text-purple-600 bg-purple-100"
      case "ready":
        return "text-green-600 bg-green-100"
      case "completed":
        return "text-primary-600 bg-primary-100"
      case "cancelled":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const canCancelOrder = () => {
    return order && ["pending", "accepted"].includes(order.orderStatus)
  }

  const canDownloadReceipt = () => {
    return order && order.paymentStatus === "completed"
  }

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return

    setCancelLoading(true)
    try {
      await axios.put(`${import.meta.env.VITE_BACKEND_API}/orders/${orderId}/cancel`)
      toast.success("Order cancelled successfully")
      fetchOrder()
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order")
    } finally {
      setCancelLoading(false)
    }
  }

  const downloadReceipt = () => {
    if (!canDownloadReceipt()) {
      toast.error("Receipt can only be downloaded after payment is confirmed")
      return
    }

    // Create PDF receipt
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("DIGITAL RECEIPT", 105, 20, { align: "center" })

    // Restaurant info
    doc.setFontSize(16)
    doc.text(order.restaurant?.name || "Restaurant", 105, 35, { align: "center" })
    doc.setFontSize(10)
    doc.text(order.restaurant?.address || "", 105, 42, { align: "center" })
    doc.text(`Phone: ${order.restaurant?.phone || ""}`, 105, 48, { align: "center" })

    // Line separator
    doc.line(20, 55, 190, 55)

    // Order details
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("ORDER DETAILS", 20, 65)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Order Number: ${order.orderNumber}`, 20, 75)
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 20, 82)
    doc.text(`Customer: ${order.customerName}`, 20, 89)
    doc.text(`Phone: ${order.customerPhone}`, 20, 96)
    if (order.tableNumber) {
      doc.text(`Table: ${order.tableNumber}`, 20, 103)
    }

    // Items header
    let yPos = order.tableNumber ? 115 : 108
    doc.setFont("helvetica", "bold")
    doc.text("ITEMS ORDERED", 20, yPos)

    // Items list
    yPos += 10
    doc.setFont("helvetica", "normal")
    order.items?.forEach((item) => {
      doc.text(`${item.quantity}x ${item.dish?.name}`, 20, yPos)
      doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, 160, yPos, { align: "right" })
      yPos += 7
    })

    // Line separator
    yPos += 5
    doc.line(20, yPos, 190, yPos)

    // Total
    yPos += 10
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("TOTAL AMOUNT", 20, yPos)
    doc.text(`₹${order.totalAmount}`, 160, yPos, { align: "right" })

    // Payment info
    yPos += 15
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 20, yPos)
    doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 20, yPos + 7)

    // Footer
    yPos += 25
    doc.line(20, yPos, 190, yPos)
    yPos += 10
    doc.text("Thank you for your order!", 105, yPos, { align: "center" })
    doc.text("Visit us again soon!", 105, yPos + 7, { align: "center" })

    // Save the PDF
    doc.save(`receipt-${order.orderNumber}.pdf`)
    toast.success("Receipt downloaded successfully!")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const statusSteps = getStatusSteps()

  return (
    <div className="min-h-screen bg-warm-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="p-4 text-center">
          <h1 className="text-xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-gray-600">{order.orderNumber}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Order Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="text-center mb-6">
            <div
              className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus)}`}
            >
              {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
            </div>
            <p className="text-gray-600 mt-2">
              {order.orderStatus === "completed"
                ? "Your order has been completed!"
                : order.orderStatus === "cancelled"
                  ? "Your order has been cancelled"
                  : order.orderStatus === "ready"
                    ? "Your order is ready for pickup!"
                    : order.orderStatus === "preparing"
                      ? "Your order is being prepared"
                      : order.orderStatus === "accepted"
                        ? "Your order has been accepted"
                        : "Your order has been placed"}
            </p>
          </div>

          {/* Progress Steps - only show if not cancelled */}
          {order.orderStatus !== "cancelled" && (
            <div className="space-y-4">
              {statusSteps.map((step, index) => (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed
                        ? "bg-primary-600 text-white"
                        : step.active
                          ? "bg-primary-100 text-primary-600 border-2 border-primary-600"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${step.completed || step.active ? "text-gray-900" : "text-gray-500"}`}>
                      {step.label}
                    </p>
                  </div>
                  {step.completed && <CheckCircle className="w-5 h-5 text-primary-600" />}
                </motion.div>
              ))}
            </div>
          )}

          {order.estimatedTime && order.orderStatus !== "completed" && order.orderStatus !== "cancelled" && (
            <div className="mt-6 p-4 bg-warm-50 rounded-xl">
              <div className="flex items-center space-x-2 text-warm-700">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Estimated time: {order.estimatedTime} minutes</span>
              </div>
            </div>
          )}

          {/* Cancel Order Button */}
          {canCancelOrder() && (
            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>{cancelLoading ? "Cancelling..." : "Cancel Order"}</span>
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Restaurant Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Restaurant Details</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{order.restaurant?.name}</p>
                <p className="text-sm text-gray-600">{order.restaurant?.address}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <p className="text-gray-900">{order.restaurant?.phone}</p>
            </div>
          </div>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Order Details</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <p className="text-gray-900">{order.customerName}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <p className="text-gray-900">{order.customerPhone}</p>
            </div>
            {order.tableNumber && (
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <p className="text-gray-900">Table {order.tableNumber}</p>
              </div>
            )}
            <div className="text-sm text-gray-600">Ordered on {new Date(order.createdAt).toLocaleString()}</div>
          </div>

          {order.specialInstructions && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Special Instructions:</strong> {order.specialInstructions}
              </p>
            </div>
          )}
        </motion.div>

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.dish?.name}</p>
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
                <span className="text-xl font-bold text-primary-600">₹{order.totalAmount}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">Payment Method</span>
                <span className="text-sm text-gray-900 capitalize">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">Payment Status</span>
                <span
                  className={`text-sm font-medium capitalize ${
                    order.paymentStatus === "completed"
                      ? "text-green-600"
                      : order.paymentStatus === "pending"
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Download Receipt */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: canDownloadReceipt() ? 1.02 : 1 }}
          whileTap={{ scale: canDownloadReceipt() ? 0.98 : 1 }}
          onClick={downloadReceipt}
          disabled={!canDownloadReceipt()}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors ${
            canDownloadReceipt()
              ? "bg-primary-600 hover:bg-primary-700 text-white"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Receipt className="w-5 h-5" />
          <span>Download Receipt (PDF)</span>
          <Download className="w-4 h-4" />
        </motion.button>

        {!canDownloadReceipt() && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <AlertTriangle className="w-4 h-4" />
            <span>Receipt available after payment confirmation</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderTracking
