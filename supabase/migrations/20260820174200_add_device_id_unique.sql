-- Add unique constraint to device_id for upsert support
ALTER TABLE "public"."connected_devices"
ADD CONSTRAINT "connected_devices_device_id_key" UNIQUE ("device_id");
