"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { countries } from "@/lib/countries";

interface NationalitySelectorProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
}

export function NationalitySelector({ value, onChange, className }: NationalitySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Find country by value, handle empty string as "Keine Angabe"
    const selectedCountry = useMemo(() =>
        countries.find(c => c.value === (value ?? "")),
        [value]);

    const filteredCountries = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();

        // Filter the whole list based on search
        const matches = countries.filter(c =>
            c.label.toLowerCase().includes(lowerSearch) ||
            c.value.toLowerCase().includes(lowerSearch)
        );

        if (!lowerSearch) return matches;

        // If searching, keep the original order (which has Keine Angabe and Deutschland at top)
        return matches;
    }, [searchTerm]);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={cn("relative w-full", className)} ref={containerRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={isOpen}
                className="w-full justify-between h-10 px-3 font-normal bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedCountry ? (
                    <div className="flex items-center gap-2">
                        <span className="text-base">{selectedCountry.flag}</span>
                        <span className={cn(selectedCountry.value === "" && "text-zinc-500 italic")}>
                            {selectedCountry.label}
                        </span>
                    </div>
                ) : (
                    <span className="text-zinc-500">Nationalität wählen...</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <Search className="w-4 h-4 text-zinc-400" />
                        <input
                            autoFocus
                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-zinc-500 py-1"
                            placeholder="Land suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
                        {filteredCountries.length === 0 ? (
                            <div className="py-6 text-center text-sm text-zinc-500 italic">
                                Keine Ergebnisse gefunden.
                            </div>
                        ) : (
                            filteredCountries.map((country) => (
                                <button
                                    key={country.label} // Use label as key since value might be empty string
                                    type="button"
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors",
                                        (value ?? "") === country.value
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                                    )}
                                    onClick={() => {
                                        onChange(country.value);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                >
                                    <div className="flex items-center gap-2 text-left">
                                        <span className="text-lg leading-none">{country.flag}</span>
                                        <span className={cn(
                                            "font-medium",
                                            country.value === "" && "italic text-zinc-500"
                                        )}>
                                            {country.label}
                                        </span>
                                    </div>
                                    {(value ?? "") === country.value && <Check className="w-4 h-4" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
