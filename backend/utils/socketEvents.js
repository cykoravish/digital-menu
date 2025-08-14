// Socket.io event handlers and utilities
const socketEvents = {
  // Order events
  ORDER_CREATED: "order-created",
  ORDER_STATUS_UPDATED: "order-status-updated",
  ORDER_CANCELLED: "order-cancelled",

  // Restaurant events
  RESTAURANT_STATUS_UPDATED: "restaurant-status-updated",
  NEW_ORDER_NOTIFICATION: "new-order-notification",

  // Admin events
  ADMIN_NOTIFICATION: "admin-notification",

  // Superadmin events
  SUPERADMIN_NOTIFICATION: "superadmin-notification",
  PLATFORM_STATS_UPDATED: "platform-stats-updated",
}

const emitToRestaurant = (io, restaurantId, event, data) => {
  io.to(`restaurant-${restaurantId}`).emit(event, data)
}

const emitToOrder = (io, orderId, event, data) => {
  io.to(`order-${orderId}`).emit(event, data)
}

const emitToSuperadmin = (io, event, data) => {
  io.to("superadmin").emit(event, data)
}

const emitToAdmin = (io, adminId, event, data) => {
  io.to(`admin-${adminId}`).emit(event, data)
}

export { socketEvents, emitToRestaurant, emitToOrder, emitToSuperadmin, emitToAdmin }
