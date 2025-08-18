"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ExternalLink, Star, Zap } from "lucide-react"

const AdBanner = ({ restaurantId }) => {
  const [showAd, setShowAd] = useState(false)
  const [adData, setAdData] = useState(null)

  useEffect(() => {
    checkAdStatus()
  }, [restaurantId])

  const checkAdStatus = async () => {
    try {
      // Check if restaurant owner has premium subscription
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/restaurants/${restaurantId}/ad-status`)
      const data = await response.json()

      // Only show ad if restaurant doesn't have premium and user hasn't closed it this session
      const adClosed = localStorage.getItem(`ad-closed-${restaurantId}`)
      if (!data.hasPremium && !adClosed) {
        setAdData({
          title: "Grow Your Restaurant Business",
          description: "Join thousands of restaurants using our platform to increase orders and revenue by 40%",
          buttonText: "Start Free Trial",
          link: "https://yourplatform.com/signup",
          image: "/placeholder.svg?height=80&width=80",
          features: ["No Setup Fees", "24/7 Support", "Real-time Analytics"],
        })
        // Show ad after a short delay for better UX
        setTimeout(() => setShowAd(true), 2000)
      }
    } catch (error) {
      console.error("Error checking ad status:", error)
    }
  }

  const handleClose = () => {
    setShowAd(false)
    // Store in localStorage to not show again for this session
    localStorage.setItem(`ad-closed-${restaurantId}`, "true")
  }

  const handleAdClick = () => {
    window.open(adData.link, "_blank")
    // Track ad click if needed
    console.log("Ad clicked for restaurant:", restaurantId)
  }

  if (!showAd || !adData) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-2xl z-50 overflow-hidden"
      >
        <div className="relative p-6">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="flex-1 text-white">
              <h3 className="font-bold text-lg mb-1">{adData.title}</h3>
              <p className="text-white/90 text-sm mb-3">{adData.description}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {adData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-1 text-xs bg-white/20 rounded-full px-2 py-1">
                    <Star className="w-3 h-3" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdClick}
                className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold text-sm flex items-center space-x-2 hover:bg-orange-50 transition-colors"
              >
                <span>{adData.buttonText}</span>
                <ExternalLink className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AdBanner
