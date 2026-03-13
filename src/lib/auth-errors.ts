/**
 * Translates Supabase Auth error messages to German.
 */
export function getGermanAuthError(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("invalid login credentials")) {
        return "Ungültige E-Mail-Adresse oder Passwort.";
    }
    
    if (lowerMessage.includes("email not confirmed")) {
        return "E-Mail-Adresse wurde noch nicht bestätigt.";
    }

    if (lowerMessage.includes("user already registered") || lowerMessage.includes("already exists")) {
        return "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits.";
    }

    if (lowerMessage.includes("password is too short")) {
        return "Das Passwort muss mindestens 6 Zeichen lang sein.";
    }

    if (lowerMessage.includes("rate limit exceeded") || lowerMessage.includes("too many requests")) {
        return "Zu viele Versuche. Bitte versuche es später noch einmal.";
    }

    // Default error for unknown messages
    return message || "Ein Fehler ist aufgetreten. Bitte versuche es später noch einmal.";
}
