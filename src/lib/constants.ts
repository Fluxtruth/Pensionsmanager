export const ROOM_TYPES = [
    "Einzelzimmer",
    "Doppelzimmer",
    "2 Einzelbetten",
    "3 Einzelbetten",
    "Ferienwohnung"
] as const;

export type RoomType = (typeof ROOM_TYPES)[number];
