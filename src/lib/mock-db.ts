export type TableName = 'Bookings' | 'Guests' | 'Rooms' | 'AuditLogs';

export interface Booking {
    id: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    room: string;
    status: 'confirmed' | 'pending' | 'cancelled';
    totalAmount: number;
}

export interface Guest {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: string;
}

export interface Room {
    id: string;
    name: string;
    type: string;
    capacity: number;
    status: 'clean' | 'dirty' | 'occupied';
}

export interface AuditLog {
    id: string;
    action: string;
    user: string;
    timestamp: string;
    details: string;
}

export const mockTables: Record<TableName, any[]> = {
    Bookings: [
        {
            id: '550e8400-e29b-41d4-a716-446655440000',
            guestName: 'Max Mustermann',
            checkIn: '2023-10-25',
            checkOut: '2023-10-30',
            room: '101',
            status: 'confirmed',
            totalAmount: 450.00,
        },
        {
            id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            guestName: 'Erika Musterfrau',
            checkIn: '2023-11-01',
            checkOut: '2023-11-05',
            room: '102',
            status: 'pending',
            totalAmount: 320.00,
        },
        {
            id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
            guestName: 'John Doe',
            checkIn: '2023-12-10',
            checkOut: '2023-12-15',
            room: '205',
            status: 'cancelled',
            totalAmount: 0.00,
        },
    ],
    Guests: [
        {
            id: '123e4567-e89b-12d3-a456-426614174000',
            firstName: 'Max',
            lastName: 'Mustermann',
            email: 'max@example.com',
            phone: '+49 123 456789',
            createdAt: '2023-01-15T10:00:00Z',
        },
        {
            id: '987fcdeb-51a2-43f7-9012-345678901234',
            firstName: 'Erika',
            lastName: 'Musterfrau',
            email: 'erika@example.com',
            phone: '+49 987 654321',
            createdAt: '2023-02-20T14:30:00Z',
        },
    ],
    Rooms: [
        { id: 'r1', name: 'Room 101', type: 'Single', capacity: 1, status: 'clean' },
        { id: 'r2', name: 'Room 102', type: 'Double', capacity: 2, status: 'occupied' },
        { id: 'r3', name: 'Room 201', type: 'Suite', capacity: 4, status: 'dirty' },
    ],
    AuditLogs: [
        { id: 'l1', action: 'Create Booking', user: 'admin', timestamp: '2023-10-25T09:00:00Z', details: 'Booking created for Max Mustermann' },
        { id: 'l2', action: 'Update Room Status', user: 'housekeeping', timestamp: '2023-10-25T11:00:00Z', details: 'Room 101 marked as clean' },
    ]
};
