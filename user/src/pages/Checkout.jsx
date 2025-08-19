// "use client";

// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//   ArrowLeft,
//   CreditCard,
//   Banknote,
//   User,
//   Phone,
//   MapPin,
//   MessageSquare,
// } from "lucide-react";
// import { useCart } from "../contexts/CartContext";
// import AdBanner from "../components/AdBanner";
// import axios from "axios";
// import { toast } from "react-hot-toast";
// import { generateUPIQR } from "@sk-py/upi-qr";

// const Checkout = () => {
//   const { restaurantId } = useParams();
//   const navigate = useNavigate();
//   const { cartItems, getTotalPrice, clearCart } = useCart();

//   const [formData, setFormData] = useState({
//     customerName: "",
//     customerPhone: "",
//     tableNumber: "",
//     paymentMethod: "cash",
//     specialInstructions: "",
//   });

//   const [loading, setLoading] = useState(false);
//   const [restaurant, setRestaurant] = useState(null);
//   const [formErrors, setFormErrors] = useState({});
//   const [upiLink, setUpiLink] = useState("");
//   const [qrCode, setQrCode] = useState("");
//   console.log("formData: ", formData);

//   const searchParams = new URLSearchParams(window.location.search);
//   const isFromTracking = searchParams.get("from") === "tracking";
//   const originalOrderId = searchParams.get("originalOrder");

//   useEffect(() => {
//     const fetchRestaurant = async () => {
//       try {
//         const response = await axios.get(
//           `${import.meta.env.VITE_BACKEND_API}/restaurants/${restaurantId}`
//         );
//         setRestaurant(response.data.restaurant);
//       } catch (error) {
//         console.error("Failed to fetch restaurant details:", error);
//       }
//     };

//     fetchRestaurant();
//   }, [restaurantId]);

//   useEffect(() => {
//     console.log("[v0] Checkout page loaded:", {
//       restaurantId,
//       cartItemsCount: cartItems.length,
//       cartItems: cartItems.map((item) => ({
//         name: item.name,
//         quantity: item.quantity,
//       })),
//     });
//   }, [restaurantId, cartItems]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//     // Clear error when user starts typing
//     if (formErrors[name]) {
//       setFormErrors({
//         ...formErrors,
//         [name]: "",
//       });
//     }
//   };

//   const validateForm = () => {
//     const errors = {};

//     if (!formData.customerName.trim()) {
//       errors.customerName = "Name is required";
//     }

//     if (!formData.customerPhone.trim()) {
//       errors.customerPhone = "Phone number is required";
//     } else if (!/^[6-9]\d{9}$/.test(formData.customerPhone.trim())) {
//       errors.customerPhone =
//         "Please enter a valid 10-digit Indian phone number";
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const handleUpiPayment = async (orderData) => {
//     try {
//       if (
//         !restaurant?.upiDetails?.isUpiEnabled ||
//         !restaurant?.upiDetails?.upiId
//       ) {
//         toast.error("UPI payment is not available for this restaurant");
//         return;
//       }

//       // First create the order with pending payment status
//       const response = await axios.post(
//         `${import.meta.env.VITE_BACKEND_API}/orders`,
//         {
//           ...orderData,
//           paymentStatus: "pending",
//         }
//       );
//       const order = response.data.order;

//       // 2. Generate UPI QR + intent link using @sk-py/upi-qr
//       const { qr, intent } = await generateUPIQR({
//         payeeVPA: restaurant.upiDetails.upiId,
//         payeeName: restaurant.upiDetails.merchantName,
//         amount: getTotalPrice().toFixed(2),
//         transactionNote: `Order #${order.orderNumber} - ${restaurant.name}`,
//         transactionRef: `ORDER${order._id}`, // unique ref
//         currency: "INR",
//         url: `${window.location.origin}/order/${order._id}`, // optional deep link
//       });

//       // 3. Save link & QR to state (so you can render in UI if needed)
//       setUpiLink(intent);
//       setQrCode(qr);

//       // Try to open UPI app
//       const upiWindow = window.open(intent, "_blank");

//       // If UPI app doesn't open, show manual instructions
//       setTimeout(() => {
//         if (!upiWindow || upiWindow.closed) {
//           toast.success("Order placed! Please complete the UPI payment.", {
//             duration: 5000,
//           });
//         }
//       }, 1000);

//       clearCart();

//       if (isFromTracking) {
//         window.open(`/order/${order._id}`, "_blank");
//         navigate(`/order/${originalOrderId}`);
//       } else {
//         navigate(`/order/${order._id}`);
//       }
//     } catch (error) {
//       const errorMessage =
//         error.response?.data?.message || "Failed to create order";
//       toast.error(errorMessage);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validateForm()) {
//       toast.error("Please fill in all required fields correctly");
//       return;
//     }

//     setLoading(true);

//     try {
//       const orderData = {
//         restaurantId,
//         items: cartItems.map((item) => ({
//           dishId: item._id,
//           quantity: item.quantity,
//         })),
//         ...formData,
//       };

//       if (formData.paymentMethod === "upi") {
//         await handleUpiPayment(orderData);
//       } else {
//         // Cash payment - create order directly
//         const response = await axios.post(
//           `${import.meta.env.VITE_BACKEND_API}/orders`,
//           orderData
//         );
//         const order = response.data.order;

//         clearCart();
//         toast.success("Order placed successfully!");

//         if (isFromTracking) {
//           window.open(`/order/${order._id}`, "_blank");
//           navigate(`/order/${originalOrderId}`);
//         } else {
//           navigate(`/order/${order._id}`);
//         }
//       }
//     } catch (error) {
//       const errorMessage =
//         error.response?.data?.message || "Failed to place order";
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleBack = () => {
//     navigate(`/menu/${restaurantId}`);
//   };

//   if (cartItems.length === 0) {
//     return (
//       <div className="min-h-screen flex items-center justify-center p-4">
//         <div className="text-center">
//           <h1 className="text-2xl font-bold text-gray-900 mb-2">
//             Your cart is empty
//           </h1>
//           <p className="text-gray-600 mb-6">
//             Add some items to your cart before checkout
//           </p>
//           <div className="space-y-3">
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               onClick={handleBack}
//               className="btn-primary block w-full"
//             >
//               Back to Menu
//             </motion.button>
//             <motion.button
//               whileHover={{ scale: 1.02 }}
//               whileTap={{ scale: 0.98 }}
//               onClick={() => navigate(-1)}
//               className="text-gray-600 hover:text-gray-900 text-sm"
//             >
//               Go Back
//             </motion.button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-warm-50 pb-6">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
//         <div className="flex items-center justify-between p-4">
//           <motion.button
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={handleBack}
//             className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
//           >
//             <ArrowLeft className="w-5 h-5" />
//             <span>Back</span>
//           </motion.button>
//           <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
//           <div className="w-16" />
//         </div>
//       </div>

//       <div className="max-w-md mx-auto p-4 space-y-6">
//         {/* Order Summary */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="card"
//         >
//           <h2 className="text-lg font-bold text-gray-900 mb-4">
//             Order Summary
//           </h2>
//           <div className="space-y-3">
//             {cartItems.map((item) => (
//               <div key={item._id} className="flex items-center justify-between">
//                 <div className="flex-1">
//                   <p className="font-medium text-gray-900">{item.name}</p>
//                   <p className="text-sm text-gray-600">
//                     ₹{item.price} × {item.quantity}
//                   </p>
//                 </div>
//                 <p className="font-semibold text-gray-900">
//                   ₹{(item.price * item.quantity).toFixed(2)}
//                 </p>
//               </div>
//             ))}
//             <div className="border-t border-gray-200 pt-3">
//               <div className="flex items-center justify-between">
//                 <span className="text-lg font-bold text-gray-900">Total</span>
//                 <span className="text-xl font-bold text-orange-600">
//                   ₹{getTotalPrice().toFixed(2)}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </motion.div>

//         {/* Customer Information */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.1 }}
//           className="card"
//         >
//           <h2 className="text-lg font-bold text-gray-900 mb-4">
//             Customer Information
//           </h2>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <User className="w-4 h-4 inline mr-2" />
//                 Full Name *
//               </label>
//               <input
//                 type="text"
//                 name="customerName"
//                 value={formData.customerName}
//                 onChange={handleChange}
//                 className={`input w-full ${
//                   formErrors.customerName ? "border-red-500" : ""
//                 }`}
//                 placeholder="Enter your name"
//                 required
//               />
//               {formErrors.customerName && (
//                 <p className="text-red-500 text-sm mt-1">
//                   {formErrors.customerName}
//                 </p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <Phone className="w-4 h-4 inline mr-2" />
//                 Phone Number *
//               </label>
//               <input
//                 type="tel"
//                 name="customerPhone"
//                 value={formData.customerPhone}
//                 onChange={handleChange}
//                 className={`input w-full ${
//                   formErrors.customerPhone ? "border-red-500" : ""
//                 }`}
//                 placeholder="Enter your phone number"
//                 required
//               />
//               {formErrors.customerPhone && (
//                 <p className="text-red-500 text-sm mt-1">
//                   {formErrors.customerPhone}
//                 </p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <MapPin className="w-4 h-4 inline mr-2" />
//                 Table Number (Optional)
//               </label>
//               <input
//                 type="text"
//                 name="tableNumber"
//                 value={formData.tableNumber}
//                 onChange={handleChange}
//                 className="input w-full"
//                 placeholder="e.g., Table 5"
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 <MessageSquare className="w-4 h-4 inline mr-2" />
//                 Special Instructions (Optional)
//               </label>
//               <textarea
//                 name="specialInstructions"
//                 value={formData.specialInstructions}
//                 onChange={handleChange}
//                 rows={3}
//                 className="textarea w-full"
//                 placeholder="Any special requests or dietary requirements..."
//               />
//             </div>
//           </form>
//         </motion.div>

//         {/* Payment Method */}
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//           className="card"
//         >
//           <h2 className="text-lg font-bold text-gray-900 mb-4">
//             Payment Method
//           </h2>
//           <div className="space-y-3">
//             <motion.label
//               whileHover={{ scale: 1.02 }}
//               className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
//                 formData.paymentMethod === "cash"
//                   ? "border-orange-500 bg-orange-50"
//                   : "border-gray-200 hover:border-gray-300"
//               }`}
//             >
//               <input
//                 type="radio"
//                 name="paymentMethod"
//                 value="cash"
//                 checked={formData.paymentMethod === "cash"}
//                 onChange={handleChange}
//                 className="sr-only"
//               />
//               <Banknote className="w-6 h-6 text-orange-600 mr-3" />
//               <div>
//                 <p className="font-medium text-gray-900">Pay with Cash</p>
//                 <p className="text-sm text-gray-600">
//                   Pay when your order arrives
//                 </p>
//               </div>
//             </motion.label>

//             <motion.label
//               whileHover={{ scale: 1.02 }}
//               className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
//                 formData.paymentMethod === "upi"
//                   ? "border-orange-500 bg-orange-50"
//                   : "border-gray-200 hover:border-gray-300"
//               } ${
//                 !restaurant?.upiDetails?.isUpiEnabled
//                   ? "opacity-50 cursor-not-allowed"
//                   : ""
//               }`}
//             >
//               <input
//                 type="radio"
//                 name="paymentMethod"
//                 value="upi"
//                 checked={formData.paymentMethod === "upi"}
//                 onChange={handleChange}
//                 disabled={!restaurant?.upiDetails?.isUpiEnabled}
//                 className="sr-only"
//               />
//               <CreditCard className="w-6 h-6 text-orange-600 mr-3" />
//               <div>
//                 <p className="font-medium text-gray-900">UPI Payment</p>
//                 <p className="text-sm text-gray-600">
//                   {restaurant?.upiDetails?.isUpiEnabled
//                     ? "Pay directly to restaurant via UPI"
//                     : "UPI payment not available"}
//                 </p>
//               </div>
//             </motion.label>
//           </div>
//         </motion.div>

//         {/* Place Order Button */}
//         <motion.button
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//           whileHover={{ scale: 1.02 }}
//           whileTap={{ scale: 0.98 }}
//           onClick={handleSubmit}
//           disabled={loading}
//           className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {loading
//             ? "Placing Order..."
//             : `Place Order • ₹${getTotalPrice().toFixed(2)}`}
//         </motion.button>
//       </div>
//       <div>
//         {qrCode && (
//           <div className="text-center mt-4">
//             <h3 className="font-semibold text-gray-900 mb-2">Scan to Pay</h3>
//             <img src={qrCode} alt="UPI QR Code" className="mx-auto w-40 h-40" />
//             <p className="mt-2 text-sm text-orange-600">
//               Or click{" "}
//               <a href={upiLink} className="underline">
//                 here
//               </a>{" "}
//               to pay
//             </p>
//           </div>
//         )}
//       </div>
//       {/* AdBanner for checkout page to show ads for free plan restaurants */}
//       <AdBanner restaurantId={restaurantId} placement="checkout" />
//     </div>
//   );
// };

// export default Checkout;

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  User,
  Phone,
  MapPin,
  MessageSquare,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import AdBanner from "../components/AdBanner";
import axios from "axios";
import { toast } from "react-hot-toast";
import { generateUPIQR } from "@sk-py/upi-qr";

const Checkout = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { cartItems, getTotalPrice, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    tableNumber: "",
    paymentMethod: "cash",
    specialInstructions: "",
  });

  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [upiData, setUpiData] = useState(null); // Store both QR and intent link
  const [showUpiDetails, setShowUpiDetails] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);

  console.log("formData: ", formData);

  const searchParams = new URLSearchParams(window.location.search);
  const isFromTracking = searchParams.get("from") === "tracking";
  const originalOrderId = searchParams.get("originalOrder");

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_API}/restaurants/${restaurantId}`
        );
        setRestaurant(response.data.restaurant);
      } catch (error) {
        console.error("Failed to fetch restaurant details:", error);
        toast.error("Failed to load restaurant details");
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  useEffect(() => {
    console.log("[v0] Checkout page loaded:", {
      restaurantId,
      cartItemsCount: cartItems.length,
      cartItems: cartItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
    });
  }, [restaurantId, cartItems]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerName.trim()) {
      errors.customerName = "Name is required";
    }

    if (!formData.customerPhone.trim()) {
      errors.customerPhone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.customerPhone.trim())) {
      errors.customerPhone =
        "Please enter a valid 10-digit Indian phone number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const generateUpiPayment = async (order) => {
    try {
      if (
        !restaurant?.upiDetails?.isUpiEnabled ||
        !restaurant?.upiDetails?.upiId
      ) {
        throw new Error("UPI payment is not available for this restaurant");
      }

      const totalAmount = getTotalPrice();
      
      // Generate UPI QR and intent link
      const upiOptions = {
        payeeVPA: restaurant.upiDetails.upiId,
        payeeName: restaurant.upiDetails.merchantName || restaurant.name,
        amount: totalAmount.toFixed(2),
        transactionNote: `Order #${order.orderNumber} - ${restaurant.name}`,
        transactionRef: `ORDER${order._id}${Date.now()}`, // Make it more unique
        currency: "INR",
      };

      console.log("Generating UPI with options:", upiOptions);

      const result = await generateUPIQR(upiOptions);
      
      if (!result || !result.qr || !result.intent) {
        throw new Error("Failed to generate UPI payment details");
      }

      return {
        qrCode: result.qr,
        intentLink: result.intent,
        amount: totalAmount,
        orderId: order._id,
      };
    } catch (error) {
      console.error("UPI generation error:", error);
      throw new Error(`UPI payment setup failed: ${error.message}`);
    }
  };

  const handleUpiPayment = async (orderData) => {
    try {
      setLoading(true);

      // First create the order with pending payment status
      console.log("Creating order with data:", orderData);
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/orders`,
        {
          ...orderData,
          paymentStatus: "pending",
        }
      );
      
      const order = response.data.order;
      console.log("Order created:", order);
      
      setOrderCreated(order);

      // Generate UPI payment details
      const upiPaymentData = await generateUpiPayment(order);
      setUpiData(upiPaymentData);
      setShowUpiDetails(true);

      // Try to open UPI app automatically
      const upiWindow = window.open(upiPaymentData.intentLink, "_blank");

      // Show success message
      toast.success("Order created! Complete UPI payment to confirm.", {
        duration: 6000,
      });

      // Check if UPI app opened successfully
      setTimeout(() => {
        if (!upiWindow || upiWindow.closed) {
          toast.info("If UPI app didn't open, use the QR code or manual link below", {
            duration: 4000,
          });
        }
      }, 2000);

    } catch (error) {
      console.error("UPI payment error:", error);
      const errorMessage = error.message || "Failed to create UPI payment";
      toast.error(errorMessage);
      setOrderCreated(null);
      setUpiData(null);
      setShowUpiDetails(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = async (orderData) => {
    try {
      setLoading(true);
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/orders`,
        {
          ...orderData,
          paymentStatus: "pending", // or "confirmed" based on your business logic
        }
      );
      
      const order = response.data.order;
      
      clearCart();
      toast.success("Order placed successfully!");

      if (isFromTracking) {
        window.open(`/order/${order._id}`, "_blank");
        navigate(`/order/${originalOrderId}`);
      } else {
        navigate(`/order/${order._id}`);
      }
    } catch (error) {
      console.error("Cash payment error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to place order";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    const orderData = {
      restaurantId,
      items: cartItems.map((item) => ({
        dishId: item._id,
        quantity: item.quantity,
      })),
      ...formData,
    };

    if (formData.paymentMethod === "upi") {
      await handleUpiPayment(orderData);
    } else {
      await handleCashPayment(orderData);
    }
  };

  const handleContinueAfterUpi = () => {
    clearCart();
    
    if (isFromTracking) {
      window.open(`/order/${orderCreated._id}`, "_blank");
      navigate(`/order/${originalOrderId}`);
    } else {
      navigate(`/order/${orderCreated._id}`);
    }
  };

  const handleRetryUpi = async () => {
    if (upiData?.intentLink) {
      window.open(upiData.intentLink, "_blank");
      toast.info("Opening UPI app...");
    }
  };

  const handleBack = () => {
    navigate(`/menu/${restaurantId}`);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-6">
            Add some items to your cart before checkout
          </p>
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBack}
              className="btn-primary block w-full"
            >
              Back to Menu
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Go Back
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </motion.button>
          <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Show UPI Payment Details if generated */}
        {showUpiDetails && upiData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card border-2 border-orange-500 bg-orange-50"
          >
            <h2 className="text-lg font-bold text-orange-900 mb-4 flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Complete UPI Payment
            </h2>
            
            <div className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={upiData.qrCode} 
                  alt="UPI QR Code" 
                  className="mx-auto w-48 h-48 border rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Amount:</strong> ₹{upiData.amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Pay to:</strong> {restaurant?.upiDetails?.merchantName || restaurant?.name}
                </p>
                <p className="text-xs text-gray-600">
                  Order #{orderCreated?.orderNumber}
                </p>
              </div>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleRetryUpi}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open UPI App</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinueAfterUpi}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium"
                >
                  I've Completed Payment - Continue
                </motion.button>
              </div>

              <p className="text-xs text-gray-600 text-center">
                After completing payment in your UPI app, click "Continue" above
              </p>
            </div>
          </motion.div>
        )}

        {/* Order Summary - Hide if UPI payment is being processed */}
        {!showUpiDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item._id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      ₹{item.price} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-orange-600">
                    ₹{getTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Customer Information - Hide if UPI payment is being processed */}
        {!showUpiDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Customer Information
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  className={`input w-full ${
                    formErrors.customerName ? "border-red-500" : ""
                  }`}
                  placeholder="Enter your name"
                  required
                />
                {formErrors.customerName && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.customerName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className={`input w-full ${
                    formErrors.customerPhone ? "border-red-500" : ""
                  }`}
                  placeholder="Enter your phone number"
                  required
                />
                {formErrors.customerPhone && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.customerPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Table Number (Optional)
                </label>
                <input
                  type="text"
                  name="tableNumber"
                  value={formData.tableNumber}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="e.g., Table 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Special Instructions (Optional)
                </label>
                <textarea
                  name="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={handleChange}
                  rows={3}
                  className="textarea w-full"
                  placeholder="Any special requests or dietary requirements..."
                />
              </div>
            </form>
          </motion.div>
        )}

        {/* Payment Method - Hide if UPI payment is being processed */}
        {!showUpiDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Payment Method
            </h2>
            <div className="space-y-3">
              <motion.label
                whileHover={{ scale: 1.02 }}
                className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.paymentMethod === "cash"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === "cash"}
                  onChange={handleChange}
                  className="sr-only"
                />
                <Banknote className="w-6 h-6 text-orange-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Pay with Cash</p>
                  <p className="text-sm text-gray-600">
                    Pay when your order arrives
                  </p>
                </div>
              </motion.label>

              <motion.label
                whileHover={{ 
                  scale: restaurant?.upiDetails?.isUpiEnabled ? 1.02 : 1 
                }}
                className={`flex items-center p-4 border-2 rounded-xl transition-all ${
                  formData.paymentMethod === "upi"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                } ${
                  !restaurant?.upiDetails?.isUpiEnabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="upi"
                  checked={formData.paymentMethod === "upi"}
                  onChange={handleChange}
                  disabled={!restaurant?.upiDetails?.isUpiEnabled}
                  className="sr-only"
                />
                <CreditCard className="w-6 h-6 text-orange-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">UPI Payment</p>
                  <p className="text-sm text-gray-600">
                    {restaurant?.upiDetails?.isUpiEnabled
                      ? `Pay directly to ${restaurant.name} via UPI`
                      : "UPI payment not available"}
                  </p>
                </div>
              </motion.label>
            </div>

            {/* UPI Info */}
            {formData.paymentMethod === "upi" && restaurant?.upiDetails?.isUpiEnabled && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Pay to:</strong> {restaurant.upiDetails.upiId}
                  <br />
                  <strong>Merchant:</strong> {restaurant.upiDetails.merchantName || restaurant.name}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Place Order Button - Hide if UPI payment is being processed */}
        {!showUpiDetails && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : `Place Order • ₹${getTotalPrice().toFixed(2)}`}
          </motion.button>
        )}
      </div>

      {/* AdBanner for checkout page to show ads for free plan restaurants */}
      <AdBanner restaurantId={restaurantId} placement="checkout" />
    </div>
  );
};

export default Checkout;