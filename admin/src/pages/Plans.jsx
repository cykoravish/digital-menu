import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Crown, Gift, Check, X } from "lucide-react";

const SubscriptionCard = ({ plan, isActive, onUpgrade, onCancel, loading }) => {
  const isPremium = plan === "premium";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card relative overflow-hidden ${
        isPremium
          ? "border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50"
          : ""
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
          {isPremium ? (
            <Crown className="w-8 h-8 text-yellow-900" />
          ) : (
            <Gift className="w-8 h-8 text-gray-600" />
          )}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {isPremium ? "Premium Plan" : "Free Plan"}
        </h3>

        <div className="mb-4">
          <span className="text-3xl font-bold text-gray-900">
            {isPremium ? "₹199" : "₹0"}
          </span>
          <span className="text-gray-600 text-sm">
            {isPremium ? "/month" : "/forever"}
          </span>
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
            <span
              className={`${isPremium ? "text-gray-700" : "text-gray-500"}`}
            >
              Ad-free customer experience
            </span>
          </div>
          <div className="flex items-center">
            {isPremium ? (
              <Check className="w-5 h-5 text-green-500 mr-3" />
            ) : (
              <X className="w-5 h-5 text-red-500 mr-3" />
            )}
            <span
              className={`${isPremium ? "text-gray-700" : "text-gray-500"}`}
            >
              Priority customer support
            </span>
          </div>
        </div>

        {isActive ? (
          <div className="space-y-2">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
              Current Plan
            </div>
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
            {loading
              ? "Processing..."
              : isPremium
              ? "Upgrade to Premium"
              : "Current Plan"}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default function Plans() {
  const [subscription, setSubscription] = useState({
    plan: "free",
    status: "active",
  });
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  const handleUpgradeToPremium = async () => {
    setSubscriptionLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway. Please try again.");
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/subscriptions/create-premium`
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: response.data.amount,
        currency: response.data.currency,
        order_id: response.data.orderId,
        name: response.data.name,
        description: response.data.description,
        handler: async (response) => {
          try {
            await axios.post(
              `${
                import.meta.env.VITE_BACKEND_API
              }/subscriptions/verify-premium`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );

            toast.success("Premium subscription activated!");
            fetchSubscription();
          } catch (error) {
            console.log(error);
            toast.error("Payment verification failed");
          }
        },
        prefill: response.data.prefill,
        theme: {
          color: "#eab308",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        toast.error("Payment failed. Please try again.");
        console.error("Payment failed:", response.error);
      });
      rzp.open();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to initiate subscription";
      toast.error(errorMessage);
      console.error("Subscription error:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your premium subscription?"))
      return;

    setSubscriptionLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/subscriptions/cancel`
      );
      toast.success("Subscription cancelled successfully");
      fetchSubscription();
    } catch (error) {
      console.log("error:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_API}/subscriptions/current`
      );
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return (
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
  );
}
