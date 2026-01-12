"use client";

import { useState, useEffect } from "react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { DatabaseTable } from "@/components/admin/database-table";
import { initDb, tableNames } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, Download, Upload, Trash2 } from "lucide-react";
import { save, open, confirm, message } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs';

export default function DatabasePage() {
    const [selectedTableName, setSelectedTableName] = useState<string>(tableNames[0] || "bookings");
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [db, setDb] = useState<any>(null);
    const [isTauri, setIsTauri] = useState(false);

    useEffect(() => {
        const loadDb = async () => {
            const database = await initDb();
            setDb(database);
        };
        loadDb();

        // Check if we are running in Tauri
        const checkTauri = () => {
            const tauriInternals = (window as any).__TAURI_INTERNALS__;
            setIsTauri(!!tauriInternals);
        };
        checkTauri();
    }, []);

    useEffect(() => {
        if (db && selectedTableName) {
            fetchData(selectedTableName);
        }
    }, [db, selectedTableName]);

    const fetchData = async (table: string) => {
        if (!db) return;
        setLoading(true);
        try {
            // Select all columns from the table
            const result = await db.select(`SELECT * FROM ${table}`);
            if (Array.isArray(result)) {
                setData(result);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error(`Failed to fetch data for ${table}:`, error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        if (selectedTableName) {
            fetchData(selectedTableName);
        }
    };

    const handleExportTable = async (table: string) => {
        if (!isTauri || !db) return;

        try {
            setLoading(true);
            const dataToExport = await db.select(`SELECT * FROM ${table}`);

            const filePath = await save({
                filters: [{
                    name: 'JSON',
                    extensions: ['json']
                }],
                defaultPath: `${table}.json`
            });

            if (filePath) {
                const jsonString = JSON.stringify(dataToExport, null, 2);
                const encoder = new TextEncoder();
                const data = encoder.encode(jsonString);
                await writeFile(filePath, data);

                await message(`Table '${table}' exported successfully`, { title: 'Success', kind: 'info' });
            }
        } catch (error) {
            console.error(`Export failed for ${table}:`, error);
            try {
                await message(`Export failed: ${error}`, { title: 'Error', kind: 'error' });
            } catch (e) {
                console.error(e);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleImportTable = async (table: string) => {
        if (!isTauri || !db) return;

        try {
            const confirmed = await confirm(
                `This will import data into '${table}'. Existing records with the same ID will be updated. New records will be inserted. Continue?`,
                { title: `Import into ${table}`, kind: 'warning', okLabel: 'Yes, Import', cancelLabel: 'Cancel' }
            );

            if (!confirmed) return;

            const filePath = await open({
                multiple: false,
                filters: [{
                    name: 'JSON',
                    extensions: ['json']
                }]
            });

            if (filePath && typeof filePath === 'string') {
                setLoading(true);
                const fileUt8 = await readFile(filePath);
                const decoder = new TextDecoder();
                const jsonString = decoder.decode(fileUt8);
                const rows = JSON.parse(jsonString);

                if (!Array.isArray(rows)) {
                    throw new Error("Invalid JSON format. Expected an array of objects.");
                }

                let successCount = 0;
                let errorCount = 0;

                for (const row of rows) {
                    try {
                        const keys = Object.keys(row);
                        if (keys.length === 0) continue;

                        const values = Object.values(row);
                        const placeholders = keys.map(() => '?').join(',');
                        const columns = keys.map(k => `"${k}"`).join(','); // Quote columns to be safe

                        const query = `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders})`;
                        await db.execute(query, values);
                        successCount++;
                    } catch (err) {
                        console.error("Failed to insert row:", row, err);
                        errorCount++;
                    }
                }

                await message(`Import completed.\nImported/Updated: ${successCount}\nFailed: ${errorCount}`, { title: 'Import Result', kind: 'info' });
                fetchData(table); // Refresh table
            }
        } catch (error) {
            console.error(`Import failed for ${table}:`, error);
            try {
                await message(`Import failed: ${error}`, { title: 'Error', kind: 'error' });
            } catch (e) {
                console.error(e);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full overflow-hidden bg-background p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold tracking-tight">System Database</h1>
            </div>

            <Tabs
                defaultValue={selectedTableName}
                value={selectedTableName}
                onValueChange={(value) => setSelectedTableName(value)}
                className="h-[calc(100vh-120px)] flex flex-col"
            >
                <div className="flex items-center justify-between mb-4">
                    <ScrollableTabsList
                        tabs={tableNames}
                        value={selectedTableName}
                        onValueChange={setSelectedTableName}
                    />
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportTable(selectedTableName)}
                            disabled={loading || !isTauri}
                            title={!isTauri ? "Only available in Desktop App" : "Export Table to JSON"}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export JSON
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImportTable(selectedTableName)}
                            disabled={loading || !isTauri}
                            title={!isTauri ? "Only available in Desktop App" : "Import Table from JSON"}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Import JSON
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden border rounded-md p-0 mt-0 bg-card">
                    {loading ? (
                        <div className="flex h-full items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <DatabaseTable
                            data={data}
                            onRowClick={(row) => setSelectedRow(row)}
                        />
                    )}
                </div>
            </Tabs>

            <Sheet open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
                <SheetContent className="sm:max-w-xl overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle>Row Details</SheetTitle>
                        <SheetDescription>
                            Raw JSON view of the selected record from <strong>{selectedTableName}</strong>.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="rounded-md border bg-muted/50 p-4 font-mono text-sm max-h-[80vh] overflow-x-auto">
                        <pre className="whitespace-pre-wrap break-all">
                            {JSON.stringify(selectedRow, null, 2)}
                        </pre>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function ScrollableTabsList({ tabs, value, onValueChange }: { tabs: string[], value: string, onValueChange: (v: string) => void }) {
    return (
        <div className="overflow-x-auto pb-2 max-w-[calc(100%-120px)] no-scrollbar">
            <TabsList className="inline-flex w-max justify-start px-1">
                {tabs.map((table) => (
                    <TabsTrigger key={table} value={table}>
                        {table}
                    </TabsTrigger>
                ))}
            </TabsList>
        </div>
    );
}
