"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Store, ShoppingBag, DollarSign, TrendingUp, Clock } from "lucide-react"
import axios from "axios"

const StatCard = ({ title, value, icon: Icon, color, change }) => (
  <motion.div whileHover={{ scale: 1.02 }} className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {change && (
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-green-400 text-sm">{change}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
)

const RecentOrder = ({ order }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center justify-between p-4 bg-dark-700 rounded-lg"
  >
    <div className="flex-1">
      <p className="font-medium text-white">{order.orderNumber}</p>
      <p className="text-sm text-gray-400">{order.restaurant?.name}</p>
    </div>
    <div className="text-right">
      <p className="font-medium text-white">${order.totalAmount}</p>
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs ${
          order.orderStatus === "completed"
            ? "bg-green-500/20 text-green-400"
            : order.orderStatus === "pending"
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-blue-500/20 text-blue-400"
        }`}
      >
        {order.orderStatus}
      </span>
    </div>
  </motion.div>
)

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/superadmin/stats")
      setStats(response.data.stats)
      setRecentOrders(response.data.recentOrders)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to your superadmin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Admins"
          value={stats.totalAdmins}
          icon={Users}
          color="bg-blue-500"
          change="+12% from last month"
        />
        <StatCard
          title="Total Restaurants"
          value={stats.totalRestaurants}
          icon={Store}
          color="bg-green-500"
          change="+8% from last month"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          color="bg-purple-500"
          change="+23% from last month"
        />
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-yellow-500"
          change="+15% from last month"
        />
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Orders</h2>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {recentOrders.length > 0 ? (
            recentOrders.map((order, index) => <RecentOrder key={order._id} order={order} />)
          ) : (
            <p className="text-gray-400 text-center py-8">No recent orders</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
