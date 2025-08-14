"use client"

import { createContext, useContext, useState, useEffect } from "react"

const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [restaurantId, setRestaurantId] = useState(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    const savedRestaurantId = localStorage.getItem("cartRestaurantId")

    if (savedCart && savedRestaurantId) {
      setCartItems(JSON.parse(savedCart))
      setRestaurantId(savedRestaurantId)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cartItems))
      localStorage.setItem("cartRestaurantId", restaurantId)
    } else {
      localStorage.removeItem("cart")
      localStorage.removeItem("cartRestaurantId")
    }
  }, [cartItems, restaurantId])

  const addToCart = (dish, quantity = 1) => {
    // If adding from a different restaurant, clear cart
    if (restaurantId && restaurantId !== dish.restaurant) {
      setCartItems([])
      setRestaurantId(dish.restaurant)
    } else if (!restaurantId) {
      setRestaurantId(dish.restaurant)
    }

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item._id === dish._id)

      if (existingItem) {
        return prevItems.map((item) => (item._id === dish._id ? { ...item, quantity: item.quantity + quantity } : item))
      } else {
        return [...prevItems, { ...dish, quantity }]
      }
    })
  }

  const removeFromCart = (dishId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== dishId))
  }

  const updateQuantity = (dishId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(dishId)
      return
    }

    setCartItems((prevItems) => prevItems.map((item) => (item._id === dishId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setCartItems([])
    setRestaurantId(null)
    localStorage.removeItem("cart")
    localStorage.removeItem("cartRestaurantId")
  }

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const value = {
    cartItems,
    restaurantId,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
