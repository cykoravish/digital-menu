"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useParams } from "react-router-dom"
import { CheckCircle, Clock, ChefHat, Package, Truck, MapPin, Phone, User, Receipt, Download } from "lucide-react"
import axios from "axios"
import io from "socket.io-client"

const OrderTracking = () => {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
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
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}`)
      setOrder(response.data.order)
    } catch (error) {
      console.error("Error fetching order:", error)
    } finally {
      setLoading(false)
    }
  }

  const setupSocket = () => {
    const newSocket = io("http://localhost:5000")
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

  const downloadReceipt = () => {
    // Create a simple receipt content
    const receiptContent = `
      DIGITAL RECEIPT
      ================
      
      Order: ${order.orderNumber}
      Restaurant: ${order.restaurant?.name}
      Date: ${new Date(order.createdAt).toLocaleString()}
      
      Customer: ${order.customerName}
      Phone: ${order.customerPhone}
      ${order.tableNumber ? `Table: ${order.tableNumber}` : ""}
      
      ITEMS:
      ${order.items
        ?.map((item) => `${item.quantity}x ${item.dish?.name} - $${(item.price * item.quantity).toFixed(2)}`)
        .join("\n")}
      
      TOTAL: $${order.totalAmount}
      Payment: ${order.paymentMethod.toUpperCase()}
      
      Thank you for your order!
    `

    const blob = new Blob([receiptContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `receipt-${order.orderNumber}.txt`
    link.click()
    URL.revokeObjectURL(url)
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
                : order.orderStatus === "ready"
                  ? "Your order is ready for pickup!"
                  : order.orderStatus === "preparing"
                    ? "Your order is being prepared"
                    : order.orderStatus === "accepted"
                      ? "Your order has been accepted"
                      : "Your order has been placed"}
            </p>
          </div>

          {/* Progress Steps */}
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

          {order.estimatedTime && order.orderStatus !== "completed" && (
            <div className="mt-6 p-4 bg-warm-50 rounded-xl">
              <div className="flex items-center space-x-2 text-warm-700">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Estimated time: {order.estimatedTime} minutes</span>
              </div>
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
                    ${item.price} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-primary-600">${order.totalAmount}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">Payment Method</span>
                <span className="text-sm text-gray-900 capitalize">{order.paymentMethod}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Download Receipt */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={downloadReceipt}
          className="btn-secondary w-full flex items-center justify-center space-x-2"
        >
          <Receipt className="w-5 h-5" />
          <span>Download Receipt</span>
          <Download className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  )
}

export default OrderTracking
