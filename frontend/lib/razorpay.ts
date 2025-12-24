interface RazorpayResponse {
  paymentId: string;
  signature: string;
  method?: string;
}

const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpayPayment = async ({
  amount,
  orderId,
  name,
  phone,
  theme = "light"
}: {
  amount: number;
  orderId: string;
  name: string;
  phone?: string;
  theme?: "dark" | "light";
}): Promise<RazorpayResponse> => {
  if (typeof window === "undefined") {
    throw new Error("Razorpay can only be used in the browser");
  }

  const res = await loadRazorpay();
  if (!res) throw new Error("Razorpay SDK failed to load");

  return new Promise<RazorpayResponse>((resolve, reject) => {
    const options: any = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount,
      currency: "INR",
      name: "Hey Skillspoon",
      description: "Food Delivery Payment",
      image: "/hey-skillspoon-logo.png",
      order_id: orderId,
      theme: {
        color: theme !== "dark" ? "#000000" : "#ffffff",
        backdrop_color: theme === "dark" ? "#1a1a1a" : "#f5f5f5",
        hide_topbar: true,
      },
      prefill: {
        name,
        contact: phone ? "+91" + phone : "",
      },
      handler: async (response: any) => {
        try {
          const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
          const verifyRes = await fetch(base + "/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (!verifyRes.ok) throw new Error("Payment verification failed");

          const paymentDetails = await verifyRes.json();
          resolve({
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            method: paymentDetails.payment?.method || "upi",
          });
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: () => {
          // User cancelled the payment by closing the modal
          reject(new Error("Payment cancelled by user"));
        }
      }
    };

    // Create Razorpay instance safely
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  });
};