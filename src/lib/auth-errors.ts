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

    if (lowerMessage.includes("password is too short") || lowerMessage.includes("password should be at least")) {
        return "Das Passwort muss mindestens 6 Zeichen lang sein.";
    }

    if (lowerMessage.includes("new password should be different")) {
        return "Das neue Passwort muss sich vom alten Passwort unterscheiden.";
    }

    if (lowerMessage.includes("auth session missing") || lowerMessage.includes("session expired") || lowerMessage.includes("jwt expired")) {
        return "Der Link zum Zurücksetzen ist abgelaufen oder ungültig. Bitte fordere einen neuen Link an.";
    }

    if (lowerMessage.includes("rate limit exceeded") || lowerMessage.includes("too many requests") || lowerMessage.includes("email rate limit exceeded")) {
        return "Zu viele Versuche. Bitte versuche es später noch einmal.";
    }

    if (lowerMessage.includes("error sending recovery email") || lowerMessage.includes("error sending confirmation email")) {
        return "Fehler beim Senden der E-Mail. Bitte überprüfe die E-Mail-Einstellungen oder kontaktiere den Support.";
    }

    // Default error for unknown messages
    return message || "Ein Fehler ist aufgetreten. Bitte versuche es später noch einmal.";
}
