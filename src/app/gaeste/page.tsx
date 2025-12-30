"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Users, Search, GitBranch, Mail, Phone, Building2, UserCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NationalitySelector } from "@/components/NationalitySelector";
import { initDb } from "@/lib/db";
import { cn } from "@/lib/utils";

interface Guest {
    id: string;
    name: string; // Composite full name
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
    phone: string;
    company: string;
    notes: string;
    contact_info: string;
    nationality: string;
    total_revenue?: number;
}

function GuestsList() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const editId = searchParams.get("edit");
    const autoOpenHandled = useRef<string | null>(null);

    const [guests, setGuests] = useState<Guest[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDbReady, setIsDbReady] = useState(false);

    const loadGuests = async () => {
        try {
            const db = await initDb();
            if (db) {
                setIsDbReady(true);
                const results = await db.select<Guest[]>("SELECT * FROM guests ORDER BY last_name ASC, first_name ASC");
                if (results) setGuests(results);
            }
        } catch (error) {
            console.error("Failed to load guests:", error);
        }
    };

    useEffect(() => {
        loadGuests();
    }, []);

    useEffect(() => {
        if (editId && guests.length > 0 && autoOpenHandled.current !== editId) {
            const guest = guests.find(g => g.id === editId);
            if (guest) {
                setEditingGuest(guest);
                setIsEditOpen(true);
                autoOpenHandled.current = editId;
            }
        } else if (!editId) {
            autoOpenHandled.current = null;
        }
    }, [editId, guests]);

    const addGuest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        const firstName = formData.get("first_name") as string;
        const middleName = formData.get("middle_name") as string;
        const lastName = formData.get("last_name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const company = formData.get("company") as string;
        const notes = formData.get("notes") as string;
        const nationality = formData.get("nationality") as string;

        // Construct visual full name
        const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
        const contactInfo = [email, phone].filter(Boolean).join(" / ");
        const id = crypto.randomUUID();

        try {
            const db = await initDb();
            if (db) {
                await db.execute(
                    "INSERT INTO guests (id, name, first_name, middle_name, last_name, email, phone, company, notes, contact_info, nationality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [id, fullName, firstName, middleName, lastName, email, phone, company, notes, contactInfo, nationality]
                );
                await loadGuests();
                setIsOpen(false);
                form.reset();
            }
        } catch (error) {
            console.error("Failed to add guest:", error);
            alert("Fehler beim Speichern des Gastes.");
        }
    };

    const updateGuest = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingGuest) return;

        const form = e.currentTarget;
        const formData = new FormData(form);
        const firstName = formData.get("first_name") as string;
        const middleName = formData.get("middle_name") as string;
        const lastName = formData.get("last_name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const company = formData.get("company") as string;
        const notes = formData.get("notes") as string;
        const nationality = formData.get("nationality") as string;

        const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
        const contactInfo = [email, phone].filter(Boolean).join(" / ");

        try {
            const db = await initDb();
            if (db) {
                await db.execute(
                    "UPDATE guests SET name = ?, first_name = ?, middle_name = ?, last_name = ?, email = ?, phone = ?, company = ?, notes = ?, contact_info = ?, nationality = ? WHERE id = ?",
                    [fullName, firstName, middleName, lastName, email, phone, company, notes, contactInfo, nationality, editingGuest.id]
                );
                await loadGuests();
                setIsEditOpen(false);
                setEditingGuest(null);
                // Clear search param
                router.replace("/gaeste", { scroll: false });
            }
        } catch (error) {
            console.error("Failed to update guest:", error);
            alert("Fehler beim Aktualisieren des Gastes.");
        }
    };

    const deleteGuest = async (id: string, name: string) => {
        if (!confirm(`Möchten Sie den Gast "${name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;

        try {
            const db = await initDb();
            if (db) {
                // Check for existing bookings
                const bookingsRes = await db.select<{ count: number }[]>("SELECT COUNT(*) as count FROM bookings WHERE guest_id = ?", [id]);
                const bookingCount = bookingsRes?.[0]?.count || 0;

                if (bookingCount > 0) {
                    alert(`Dieser Gast kann nicht gelöscht werden, da er noch ${bookingCount} Buchung(en) im System hat. Bitte löschen Sie zuerst die Buchungen.`);
                    return;
                }

                // Automatische Bereinigung alter Anlässe (Legacy-Daten), um Gastlöschung zu ermöglichen
                await db.execute("DELETE FROM occasions WHERE main_guest_id = ?", [id]);

                await db.execute("DELETE FROM guests WHERE id = ?", [id]);
                await loadGuests();
            }
        } catch (error) {
            console.error("Failed to delete guest:", error);
            alert("Fehler beim Löschen des Gastes.");
        }
    };

    const filteredGuests = guests.filter((g) =>
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const GuestFormFields = ({ defaultValues }: { defaultValues?: Partial<Guest> }) => {
        const [nat, setNat] = useState(defaultValues?.nationality ?? "Deutschland");

        return (
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="first_name">Vorname</Label>
                        <Input id="first_name" name="first_name" defaultValue={defaultValues?.first_name} placeholder="Max" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="middle_name">Zweitname</Label>
                        <Input id="middle_name" name="middle_name" defaultValue={defaultValues?.middle_name} placeholder="Elias" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="last_name">Nachname <span className="text-red-500">*</span></Label>
                        <Input id="last_name" name="last_name" defaultValue={defaultValues?.last_name} placeholder="Mustermann" required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input id="email" name="email" type="email" defaultValue={defaultValues?.email} placeholder="max@beispiel.de" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={defaultValues?.phone} placeholder="+49 123 456789" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company">Firma</Label>
                        <Input id="company" name="company" defaultValue={defaultValues?.company} placeholder="Muster GmbH" />
                    </div>
                    <div className="space-y-2">
                        <Label>Nationalität</Label>
                        <input type="hidden" name="nationality" value={nat} />
                        <NationalitySelector value={nat} onChange={setNat} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notizen / Präferenzen</Label>
                    <Textarea id="notes" name="notes" defaultValue={defaultValues?.notes} placeholder="Besondere Wünsche, Allergien, etc." className="min-h-[100px]" />
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Gäste Management</h2>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Verwalte detaillierte Gastinformationen und Präferenzen.
                    </p>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Gast hinzufügen
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Neuen Gast anlegen</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={addGuest}>
                            <GuestFormFields />
                            <Button type="submit" className="w-full mt-2 font-bold bg-blue-600">Gast speichern</Button>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={isEditOpen} onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) {
                        setEditingGuest(null);
                        autoOpenHandled.current = null;
                        router.replace("/gaeste", { scroll: false });
                    }
                }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Gast bearbeiten: {editingGuest?.name}</DialogTitle>
                        </DialogHeader>
                        {editingGuest && (
                            <form onSubmit={updateGuest}>
                                <GuestFormFields defaultValues={editingGuest} />
                                <Button type="submit" className="w-full mt-2 font-bold bg-blue-600">Aktualisieren</Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                    placeholder="Gäste suchen nach Namen, Firma oder E-Mail..."
                    className="pl-10 h-11 bg-white dark:bg-zinc-900 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[250px] font-bold">Name</TableHead>
                            <TableHead className="font-bold">Kontakt</TableHead>
                            <TableHead className="font-bold">Unternehmen</TableHead>
                            <TableHead className="text-right font-bold">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredGuests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12 text-zinc-500 italic">
                                    {isDbReady ? "Keine Gäste gefunden." : "Wird geladen..."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredGuests.map((guest) => (
                                <TableRow key={guest.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                <UserCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-zinc-900 dark:text-zinc-100">{guest.last_name}, {guest.first_name}</div>
                                                {guest.middle_name && <div className="text-[10px] text-zinc-400 uppercase tracking-wider">{guest.middle_name}</div>}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            {guest.email && (
                                                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                                    <Mail className="w-3 h-3 text-zinc-400" />
                                                    {guest.email}
                                                </div>
                                            )}
                                            {guest.phone && (
                                                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                                                    <Phone className="w-3 h-3 text-zinc-400" />
                                                    {guest.phone}
                                                </div>
                                            )}
                                            {!guest.email && !guest.phone && <span className="text-zinc-400">-</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {guest.company ? (
                                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                                                {guest.company}
                                            </div>
                                        ) : (
                                            <span className="text-zinc-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => {
                                                    setEditingGuest(guest);
                                                    setIsEditOpen(true);
                                                }}
                                            >
                                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Bearbeiten
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-zinc-200"
                                                onClick={() => deleteGuest(guest.id, `${guest.first_name} ${guest.last_name}`)}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default function GuestsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center italic text-zinc-500 text-sm">Wird geladen...</div>}>
            <GuestsList />
        </Suspense>
    );
}
