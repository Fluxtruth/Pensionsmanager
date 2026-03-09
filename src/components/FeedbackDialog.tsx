import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Send } from "lucide-react";

interface FeedbackDialogProps {
    isOpen: boolean;
    onClose: () => void;
    type: "bug" | "feature";
}

export function FeedbackDialog({ isOpen, onClose, type }: FeedbackDialogProps) {
    const [topic, setTopic] = useState("");
    const [message, setMessage] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const isBug = type === "bug";
    const headerText = isBug ? "Fehler melden" : "Funktion wünschen";
    const descriptionText = isBug
        ? "Du hast einen Fehler entdeckt? Beschreibe kurz, was passiert ist."
        : "Du hast eine tolle Idee für eine neue Funktion? Lass es uns wissen!";
    const topicPlaceholder = isBug ? "Z.B. App stürzt ab beim Anlegen eines Gastes" : "Z.B. Erweiterter Filter für Rechnungen";
    const messagePlaceholder = isBug
        ? "Schritte, um den Fehler zu reproduzieren..."
        : "Beschreibe hier ausführlich deine Idee...";

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Construct email parameters
        const encodedSubject = encodeURIComponent(`[${isBug ? "BUG" : "FEATURE"}] ${topic}`);
        const encodedBody = encodeURIComponent(message);
        const mailtoLink = `mailto:kontakt@philipp-tschakert.de?subject=${encodedSubject}&body=${encodedBody}`;

        // Open email client
        window.location.href = mailtoLink;

        // Close dialog
        onClose();
        setTopic("");
        setMessage("");
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                            {headerText}
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                            {descriptionText}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="topic" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Thema <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="topic"
                            type="text"
                            required
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={topicPlaceholder}
                            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                            maxLength={100}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="message" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Beschreibung <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="message"
                            required
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={messagePlaceholder}
                            className="w-full h-32 px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm resize-none"
                            maxLength={2000}
                        />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={!topic.trim() || !message.trim()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            Senden
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
