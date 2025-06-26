// pages/your-payment-page.js or components/RazorpayButton.js

import React, { useEffect, useState } from 'react';
import Script from 'next/script'; // Import Script from next/script

// Extend the Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay?: any;
  }
}

const RazorpayPaymentButton = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // This useEffect ensures the button script is appended only on the client-side
    // after the component has mounted and the Razorpay checkout script is loaded.
    if (scriptLoaded && typeof window !== 'undefined' && window.Razorpay) {
      const form = document.getElementById('razorpay-form');
      if (form) {
        // Create a new script element for the payment button
        const paymentButtonScript = document.createElement('script');
        paymentButtonScript.src = 'https://checkout.razorpay.com/v1/payment-button.js';
        paymentButtonScript.async = true; // Make it async
        
        // Add your data attributes here from the Razorpay button code
        // You'll get this from your Razorpay dashboard when creating the button.
        paymentButtonScript.setAttribute('data-payment_button_id', 'pl_Ql4vflqSlMzAqK'); 

        form.appendChild(paymentButtonScript);
      }
    }
  }, [scriptLoaded]);

  return (
    <>
      {/* Load the main Razorpay checkout script */}
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
          setScriptLoaded(true);
        }}
        onError={(e) => {
          console.error("Failed to load Razorpay checkout script:", e);
        }}
      />

      {/* This is the form where the Razorpay button will be injected */}
      <form id="razorpay-form">
      </form>
    </>
  );
};

export default RazorpayPaymentButton;