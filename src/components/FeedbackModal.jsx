import React, { useEffect, useState } from "react";
import { submitFeedback } from "../auth/feedbackStore";
import { useAuth } from "../auth/AuthContext";

const CONTEXT_OPTIONS = [
  "Step 1 – Project Setup",
  "Step 2 – Door Schedule",
  "Step 3 – Hardware Sets",
  "Step 4 – Validation & Exports",
  "Dashboard / Landing",
  "Other"
];

const FeedbackModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [context, setContext] = useState(CONTEXT_OPTIONS[0]);
  const [message, setMessage] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setContext(CONTEXT_OPTIONS[0]);
      setMessage("");
      setImageDataUrl(null);
      setIsSubmitting(false);
      setError("");
      setSuccess("");
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
    reader.onload = () => {
      setImageDataUrl(reader.result);
    };
    reader.onerror = () => {
      setError("Unable to read the selected file. Please try a different image.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!message.trim()) {
      setError("Please share a quick description of the issue or suggestion.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        email: user.email,
        context,
        message: message.trim(),
        imageDataUrl
      });
      setSuccess("Thanks! Your feedback was recorded.");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error("Feedback submission failed", err);
      setError("Could not send feedback right now. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Report Feedback</h2>
          <button
            onClick={onClose}
            className="text-sm uppercase tracking-wide text-gray-500 hover:text-gray-800"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Where did this occur?</label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {CONTEXT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Feedback</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what happened or what you would improve."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-28"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Screenshot (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm"
            />
            {imageDataUrl && (
              <p className="text-xs text-gray-500 mt-1">Image attached. You can replace it by choosing another file.</p>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs text-green-600">{success}</p>}

          <div className="flex justify-end gap-2 pt-2">
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
              {isSubmitting ? "Sending..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
