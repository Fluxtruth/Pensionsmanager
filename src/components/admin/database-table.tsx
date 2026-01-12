import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DatabaseTableProps {
    data: any[];
    onRowClick: (row: any) => void;
}

export function DatabaseTable({ data, onRowClick }: DatabaseTableProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground">
                No data available in this table.
            </div>
        );
    }

    // Dynamically get headers from the first row keys
    // In a real app we might want a schematic definition, but "raw" view implies this is fine.
    const headers = Object.keys(data[0]);

    return (
        <ScrollArea className="h-full w-full border rounded-md">
            <div className="w-max min-w-full"> {/* Ensure table can scroll horizontally */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headers.map((header) => (
                                <TableHead key={header} className="whitespace-nowrap font-bold">
                                    {header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow
                                key={row.id || JSON.stringify(row)} // Fallback key if no ID
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => onRowClick(row)}
                            >
                                {headers.map((header) => (
                                    <TableCell key={`${row.id}-${header}`} className="whitespace-nowrap font-mono text-xs">
                                        {typeof row[header] === 'object'
                                            ? JSON.stringify(row[header])
                                            : String(row[header])}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </ScrollArea>
    );
}
