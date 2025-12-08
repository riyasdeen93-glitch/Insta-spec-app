import React, { useEffect, useState } from "react";
import { addFeedback } from "../auth/betaAccess";
import { useAuth } from "../auth/AuthContext";

const CONTEXT_OPTIONS = [
  "Landing",
  "Step 1 – Project Setup",
  "Step 2 – Door Schedule",
  "Step 3 – Hardware Sets",
  "Step 4 – Validation & Exports",
  "Other"
];

const BetaFeedbackModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [context, setContext] = useState(CONTEXT_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setContext(CONTEXT_OPTIONS[0]);
      setMessage("");
      setImageDataUrl(null);
      setIsSubmitting(false);
      setError("");
      setConfirmation("");
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!message.trim()) {
      setError("Please enter your feedback.");
      return;
    }
    setIsSubmitting(true);
    addFeedback({
      email: user.email,
      context,
      message: message.trim(),
      imageDataUrl
    });
    setIsSubmitting(false);
    setConfirmation("Thank you! Your feedback just made InstaSpec smarter. We’re on it!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Send Feedback</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm uppercase tracking-wide"
          >
            Close
          </button>
        </div>
        {confirmation ? (
          <div className="space-y-4 py-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900">{confirmation}</p>
            <p className="text-sm text-gray-500">Got another idea? Keep them coming anytime.</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Context
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            >
              {CONTEXT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Feedback
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-28"
              placeholder="Tell us what's working, what isn't, or what you'd love to see."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError("");
              }}
              required
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              Screenshot (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm"
            />
            {imageDataUrl && (
              <div className="mt-2 text-xs text-gray-600">
                Image attached.{" "}
                <button
                  type="button"
                  onClick={() => setImageDataUrl(null)}
                  className="text-indigo-600 underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 ${
                isSubmitting ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Sending..." : "Submit Feedback"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default BetaFeedbackModal;
