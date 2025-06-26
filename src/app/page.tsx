"use client";

import { useState } from "react";
import BackgroundRemover from "../components/BackgroundRemover";
import RazorpayPaymentButton from "./razorpayButton";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-blue-50 to-white">
      <div className="flex flex-col items-center mb-8">
        <span
          className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-pink-500   bg-clip-text text-transparent drop-shadow-lg tracking-tight"
          style={{ fontFamily: 'Geist, sans-serif', letterSpacing: '-0.04em' }}
        >
          Whype
        </span>
        <span className="mt-2 text-base font-medium text-gray-500 tracking-wide">AI Background Remover</span>
      </div>
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        Free Online Image Background Removal Tool
      </h1>
      <p className="mb-8 text-gray-600 max-w-md text-center">
        Instantly remove image backgrounds for free using our AI-powered tool. Upload your photo, erase the background with one click, and download a high-quality transparent PNG. No signup required!
      </p>
      <div className="w-full max-w-2xl">
        <BackgroundRemover />
      </div>
      <footer className="mt-10 text-sm text-gray-500 flex flex-col items-center gap-2">
        <span>Built with ❤️ Your little support by donating might keep this tool alive</span>
        <RazorpayPaymentButton />
        <div className="flex gap-4 mt-2">
          <a href="/legal#privacy-policy" className="text-blue-600 underline">Privacy Policy</a>
          <a href="/legal#terms-and-conditions" className="text-blue-600 underline">Terms & Conditions</a>
          <a href="/legal#contact-us" className="text-blue-600 underline">Contact Us</a>
        </div>
      </footer>
    </div>
  );
}
