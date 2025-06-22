import Link from "next/link";

// This file is now obsolete. The legal page is located at /legal/page.tsx for Next.js app routing.
// You can safely delete this file.

export default function Legal() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <section id="privacy-policy" className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
        <p className="text-gray-700 mb-2">Your privacy is important to us. We do not store your images or personal data. All processing is done securely and your data is never shared with third parties.</p>
      </section>
      <section id="terms-and-conditions" className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Terms and Conditions</h2>
        <p className="text-gray-700 mb-2">By using this service, you agree to use it for lawful purposes only. We reserve the right to restrict access or remove content that violates our policies.</p>
      </section>
      <footer id="contact-us" className="border-t pt-6 mt-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
        <p className="text-gray-700">For any questions, email us at <a href="mailto:support@whype.com" className="text-blue-600 underline">support@whype.com</a></p>
      </footer>
    </div>
  );
}
