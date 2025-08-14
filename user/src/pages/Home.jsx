"use client"

import { motion } from "framer-motion"
import { QrCode, Smartphone, UtensilsCrossed } from "lucide-react"

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-primary-600 rounded-full mb-8"
        >
          <UtensilsCrossed className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Digital Menu</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Scan the QR code at your table to view the restaurant menu and place your order directly from your phone.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full">
              <Smartphone className="w-8 h-8 text-primary-600" />
            </div>
            <div className="text-2xl text-gray-400">+</div>
            <div className="flex items-center justify-center w-16 h-16 bg-warm-100 rounded-full">
              <QrCode className="w-8 h-8 text-warm-600" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">How it works</h2>
          <div className="text-left space-y-3 text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                1
              </div>
              <p>Scan the QR code on your table</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                2
              </div>
              <p>Browse the menu and add items to cart</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                3
              </div>
              <p>Place your order and track its status</p>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-500 mt-6"
        >
          No app download required • Fast & secure ordering
        </motion.p>
      </motion.div>
    </div>
  )
}

export default Home
