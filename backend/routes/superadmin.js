import express from "express"
import User from "../models/User.js"
import Restaurant from "../models/Restaurant.js"
import Order from "../models/Order.js"
import Dish from "../models/Dish.js"
import { superadminAuthMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Get dashboard stats
router.get("/stats", superadminAuthMiddleware, async (req, res) => {
  try {
    const totalAdmins = await User.countDocuments({ role: "admin" })
    const totalRestaurants = await Restaurant.countDocuments()
    const totalOrders = await Order.countDocuments()
    const totalDishes = await Dish.countDocuments()

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ])

    const recentOrders = await Order.find().populate("restaurant", "name").sort({ createdAt: -1 }).limit(10)

    res.json({
      stats: {
        totalAdmins,
        totalRestaurants,
        totalOrders,
        totalDishes,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      recentOrders,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all admins
router.get("/admins", superadminAuthMiddleware, async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).populate("restaurant", "name").sort({ createdAt: -1 })

    res.json({ admins })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Block/Unblock admin
router.put("/admins/:id/toggle-block", superadminAuthMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.params.id)
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ message: "Admin not found" })
    }

    admin.isBlocked = !admin.isBlocked
    await admin.save()

    res.json({
      message: `Admin ${admin.isBlocked ? "blocked" : "unblocked"} successfully`,
      admin,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get analytics data
router.get("/analytics", superadminAuthMiddleware, async (req, res) => {
  try {
    // Monthly revenue
    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    // Top restaurants
    const topRestaurants = await Restaurant.find()
      .sort({ totalRevenue: -1 })
      .limit(10)
      .select("name totalRevenue totalOrders")

    // Order status distribution
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ])

    res.json({
      monthlyRevenue,
      topRestaurants,
      orderStatusStats,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router
