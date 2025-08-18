import express from "express"
import Razorpay from "razorpay"
import crypto from "crypto"
import User from "../models/User.js"
import { auth, adminAuth } from "../middleware/auth.js"

const router = express.Router()

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Get current subscription
router.get("/current", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    res.json({
      subscription: user.subscription,
      hasPremium: user.hasPremiumSubscription(),
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create premium subscription
router.post("/create-premium", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PREMIUM_PLAN_ID, // You need to create this plan in Razorpay dashboard
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 months
      addons: [],
      notes: {
        userId: user._id.toString(),
        email: user.email,
      },
    })

    res.json({
      subscriptionId: subscription.id,
      amount: 19900, // ₹199 in paise
      currency: "INR",
      name: "Premium Plan",
      description: "Ad-free experience for your restaurant",
      prefill: {
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Verify premium subscription payment
router.post("/verify-premium", auth, adminAuth, async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body

    // Verify signature
    const body = razorpay_payment_id + "|" + razorpay_subscription_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid signature" })
    }

    // Update user subscription
    const user = await User.findById(req.user.id)
    user.subscription = {
      plan: "premium",
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      razorpaySubscriptionId: razorpay_subscription_id,
      lastPaymentDate: new Date(),
    }
    await user.save()

    res.json({ message: "Subscription activated successfully", subscription: user.subscription })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Cancel subscription
router.post("/cancel", auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    if (user.subscription.razorpaySubscriptionId) {
      // Cancel Razorpay subscription
      await razorpay.subscriptions.cancel(user.subscription.razorpaySubscriptionId)
    }

    // Update user subscription to free
    user.subscription = {
      plan: "free",
      status: "active",
      startDate: new Date(),
      endDate: new Date("2099-12-31"),
      razorpaySubscriptionId: null,
      lastPaymentDate: null,
    }
    await user.save()

    res.json({ message: "Subscription cancelled successfully", subscription: user.subscription })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router
