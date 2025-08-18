"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Store, ChefHat, ShoppingBag, DollarSign, TrendingUp, Clock, QrCode, Crown, Gift, Check, X } from "lucide-react"
import { useAuth } from "../hooks/useAuth"
import axios from "axios"
import { toast } from "react-hot-toast"

const StatCard = ({ title, value, icon: Icon, color, change }) => (
  <motion.div whileHover={{ scale: 1.02 }} className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <div className="flex items-center mt-2">
            <TrendingUp className="w-4 h-4 text-primary-600 mr-1" />
            <span className="text-primary-600 text-sm">{change}</span>
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
    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
  >
    <div className="flex-1">
      <p className="font-medium text-gray-900">{order.orderNumber}</p>
      <p className="text-sm text-gray-500">{order.customerName}</p>
    </div>
    <div className="text-right">
      <p className="font-medium text-gray-900">₹{order.totalAmount}</p>
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs ${
          order.orderStatus === "completed"
            ? "bg-primary-100 text-primary-800"
            : order.orderStatus === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-blue-100 text-blue-800"
        }`}
      >
        {order.orderStatus}
      </span>
    </div>
  </motion.div>
)

const SubscriptionCard = ({ plan, isActive, onUpgrade, onCancel, loading }) => {
  const isPremium = plan === "premium"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card relative overflow-hidden ${
        isPremium ? "border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50" : ""
      }`}
    >
      {isPremium && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 text-xs font-bold rounded-bl-lg">
          PREMIUM
        </div>
      )}

      <div className="text-center">
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isPremium ? "bg-yellow-400" : "bg-gray-200"
          }`}
        >
          {isPremium ? <Crown className="w-8 h-8 text-yellow-900" /> : <Gift className="w-8 h-8 text-gray-600" />}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{isPremium ? "Premium Plan" : "Free Plan"}</h3>

        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900">{isPremium ? "₹199" : "₹0"}</span>
          <span className="text-gray-600 text-sm">{isPremium ? "/month" : "/forever"}</span>
        </div>

        <div className="space-y-3 mb-6 text-left">
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Full restaurant management</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Unlimited menu items</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 text-green-500 mr-3" />
            <span className="text-gray-700">Order management</span>
          </div>
          <div className="flex items-center">
            {isPremium ? (
              <Check className="w-5 h-5 text-green-500 mr-3" />
            ) : (
              <X className="w-5 h-5 text-red-500 mr-3" />
            )}
            <span className={`${isPremium ? "text-gray-700" : "text-gray-500"}`}>Ad-free customer experience</span>
          </div>
          <div className="flex items-center">
            {isPremium ? (
              <Check className="w-5 h-5 text-green-500 mr-3" />
            ) : (
              <X className="w-5 h-5 text-red-500 mr-3" />
            )}
            <span className={`${isPremium ? "text-gray-700" : "text-gray-500"}`}>Priority customer support</span>
          </div>
        </div>

        {isActive ? (
          <div className="space-y-2">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">Current Plan</div>
            {isPremium && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Processing..." : "Cancel Subscription"}
              </motion.button>
            )}
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onUpgrade}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium disabled:opacity-50 ${
              isPremium
                ? "bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            {loading ? "Processing..." : isPremium ? "Upgrade to Premium" : "Current Plan"}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

const Dashboard = () => {
  const { user } = useAuth()
  const [restaurant, setRestaurant] = useState(null)
  const [stats, setStats] = useState({
    totalDishes: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState({ plan: "free", status: "active" })
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    fetchSubscription()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch restaurant data
      if (user?.restaurant) {
        const restaurantResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_API}/restaurants/${user.restaurant._id}`,
        )
        setRestaurant(restaurantResponse.data.restaurant)

        // Fetch dishes count
        const dishesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_API}/dishes/my-dishes`)
        setStats((prev) => ({ ...prev, totalDishes: dishesResponse.data.dishes.length }))

        // Fetch orders
        const ordersResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_API}/orders/restaurant/my-orders?limit=5`,
        )
        setRecentOrders(ordersResponse.data.orders)

        // Calculate stats from restaurant data
        setStats((prev) => ({
          ...prev,
          totalOrders: restaurantResponse.data.restaurant.totalOrders || 0,
          totalRevenue: restaurantResponse.data.restaurant.totalRevenue || 0,
        }))
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/subscriptions/current`)
      setSubscription(response.data.subscription)
    } catch (error) {
      console.error("Error fetching subscription:", error)
    }
  }

  const handleUpgradeToPremium = async () => {
    setSubscriptionLoading(true)
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_API}/subscriptions/create-premium`)

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: response.data.subscriptionId,
        name: "Restaurant Premium Plan",
        description: response.data.description,
        handler: async (response) => {
          try {
            await axios.post(`${import.meta.env.VITE_BACKEND_API}/subscriptions/verify-premium`, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            })

            toast.success("Premium subscription activated!")
            fetchSubscription()
          } catch (error) {
            toast.error("Payment verification failed")
          }
        },
        prefill: response.data.prefill,
        theme: {
          color: "#22c55e",
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      toast.error("Failed to initiate subscription")
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your premium subscription?")) return

    setSubscriptionLoading(true)
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_API}/subscriptions/cancel`)
      toast.success("Subscription cancelled successfully")
      fetchSubscription()
    } catch (error) {
      toast.error("Failed to cancel subscription")
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (restaurant?.qrCode) {
      const link = document.createElement("a")
      link.href = restaurant.qrCode
      link.download = `${restaurant.name}-qr-code.png`
      link.click()
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to your restaurant management dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SubscriptionCard
          plan="free"
          isActive={subscription.plan === "free"}
          onUpgrade={() => {}}
          loading={subscriptionLoading}
        />
        <SubscriptionCard
          plan="premium"
          isActive={subscription.plan === "premium"}
          onUpgrade={handleUpgradeToPremium}
          onCancel={handleCancelSubscription}
          loading={subscriptionLoading}
        />
      </div>

      {!restaurant && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
        >
          <div className="flex items-center">
            <Store className="w-8 h-8 text-yellow-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Setup Your Restaurant</h3>
              <p className="text-yellow-700 mt-1">
                You haven't created your restaurant profile yet. Set it up to start managing your menu and orders.
              </p>
              <button className="btn-primary mt-3">Create Restaurant Profile</button>
            </div>
          </div>
        </motion.div>
      )}

      {restaurant && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Dishes"
              value={stats.totalDishes}
              icon={ChefHat}
              color="bg-primary-500"
              change="+2 this week"
            />
            <StatCard
              title="Total Orders"
              value={stats.totalOrders}
              icon={ShoppingBag}
              color="bg-blue-500"
              change="+12% from last month"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="bg-green-500"
              change="+8% from last month"
            />
            <StatCard
              title="Restaurant Status"
              value={restaurant.isOpen ? "Open" : "Closed"}
              icon={Store}
              color={restaurant.isOpen ? "bg-green-500" : "bg-red-500"}
            />
          </div>

          {/* QR Code Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <div className="text-center">
                <QrCode className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Restaurant QR Code</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Customers can scan this QR code to view your menu and place orders
                </p>
                {restaurant.qrCode && (
                  <div className="mb-4">
                    <img
                      src={restaurant.qrCode || "/placeholder.svg"}
                      alt="Restaurant QR Code"
                      className="w-32 h-32 mx-auto border border-gray-200 rounded-lg"
                    />
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadQRCode}
                  className="btn-primary w-full"
                  disabled={!restaurant.qrCode}
                >
                  Download QR Code
                </motion.button>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>

              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => <RecentOrder key={order._id} order={order} />)
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent orders</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
