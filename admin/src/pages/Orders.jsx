"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ShoppingBag, Clock, User, Phone, MapPin, DollarSign, CheckCircle } from "lucide-react"
import axios from "axios"
import useSocket from "../hooks/useSocket"

const OrderCard = ({ order, onUpdateStatus, onUpdatePaymentStatus }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "accepted":
        return "bg-blue-100 text-blue-800"
      case "preparing":
        return "bg-purple-100 text-purple-800"
      case "ready":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-primary-100 text-primary-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case "pending":
        return "accepted"
      case "accepted":
        return "preparing"
      case "preparing":
        return "ready"
      case "ready":
        return "completed"
      default:
        return null
    }
  }

  const nextStatus = getNextStatus(order.orderStatus)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="card"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{order.orderNumber}</h3>
          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.orderStatus)}`}>
          {order.orderStatus}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-gray-600 text-sm">
          <User className="w-4 h-4 mr-2" />
          {order.customerName}
        </div>
        <div className="flex items-center text-gray-600 text-sm">
          <Phone className="w-4 h-4 mr-2" />
          {order.customerPhone}
        </div>
        {order.tableNumber && (
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-2" />
            Table {order.tableNumber}
          </div>
        )}
        <div className="flex items-center text-gray-600 text-sm">
          <Clock className="w-4 h-4 mr-2" />
          Est. {order.estimatedTime} minutes
        </div>
      </div>

      {/* Order Items */}
      <div className="border-t border-gray-200 pt-3 mb-4">
        <h4 className="font-medium text-gray-900 mb-2">Items ({order.items?.length})</h4>
        <div className="space-y-2">
          {order.items?.slice(0, 3).map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.quantity}x {item.dish?.name}
              </span>
              <span className="text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {order.items?.length > 3 && <p className="text-xs text-gray-500">+{order.items.length - 3} more items</p>}
        </div>
      </div>

      {order.specialInstructions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Special Instructions:</strong> {order.specialInstructions}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center text-lg font-bold text-gray-900">
          <DollarSign className="w-5 h-5 mr-1" />₹{order.totalAmount}
        </div>

        <div className="flex gap-2">
          {order.paymentMethod === "cash" && order.paymentStatus === "pending" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdatePaymentStatus(order._id, "completed")}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Mark Paid
            </motion.button>
          )}

          {nextStatus && order.orderStatus !== "completed" && order.orderStatus !== "cancelled" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onUpdateStatus(order._id, nextStatus)}
              className="btn-primary text-sm flex items-center"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Mark as {nextStatus}
            </motion.button>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-gray-500">Payment: {order.paymentMethod}</span>
        <span
          className={`px-2 py-1 rounded-full font-medium ${
            order.paymentStatus === "completed"
              ? "bg-green-100 text-green-800"
              : order.paymentStatus === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
          }`}
        >
          {order.paymentStatus}
        </span>
      </div>
    </motion.div>
  )
}

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { on, off } = useSocket()

  useEffect(() => {
    fetchOrders()
  }, [currentPage, statusFilter])

  useEffect(() => {
    on("new-order", (newOrder) => {
      setOrders((prevOrders) => [newOrder, ...prevOrders])
    })

    on("order-status-updated", (updatedOrder) => {
      setOrders((prevOrders) => prevOrders.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)))
    })

    return () => {
      off("new-order")
      off("order-status-updated")
    }
  }, [on, off])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
      })

      if (statusFilter !== "all") {
        params.append("status", statusFilter)
      }

      const response = await axios.get(`http://localhost:5000/api/orders/restaurant/my-orders?${params}`)
      setOrders(response.data.orders)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, {
        status: newStatus,
      })

      setOrders(orders.map((order) => (order._id === orderId ? { ...order, orderStatus: newStatus } : order)))
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/payment-status`, {
        paymentStatus: newPaymentStatus,
      })

      setOrders(orders.map((order) => (order._id === orderId ? { ...order, paymentStatus: newPaymentStatus } : order)))
    } catch (error) {
      console.error("Error updating payment status:", error)
    }
  }

  const statusOptions = [
    { value: "all", label: "All Orders" },
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
    { value: "preparing", label: "Preparing" },
    { value: "ready", label: "Ready" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
          <p className="text-gray-600">Manage incoming orders and track their status</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-600">{orders.length}</p>
          <p className="text-sm text-gray-500">Orders This Page</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setStatusFilter(option.value)
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === option.value
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            onUpdateStatus={handleUpdateStatus}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="flex items-center px-4 py-2 text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {orders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {statusFilter === "all" ? "No orders yet" : `No ${statusFilter} orders`}
          </p>
        </div>
      )}
    </div>
  )
}

export default Orders
