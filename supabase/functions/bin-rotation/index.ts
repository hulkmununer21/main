import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  // No authorization or secret checks; this function is public.

  // 1. Get penalty fee from system_settings
  const { data: settings } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "bin_duty_charge_amount")
    .maybeSingle();
  const penaltyFee = settings ? parseFloat(settings.setting_value) : 10; // fallback

  // 2. Advance weekly rotation for each property
  const { data: properties } = await supabase.from("properties").select("id");
  for (const property of properties ?? []) {
    // Get all rooms for this property, ordered
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id")
      .eq("property_id", property.id)
      .order("room_number", { ascending: true });

    if (!rooms || rooms.length === 0) continue;

    // Get last week's rotation
    const { data: lastRotation } = await supabase
      .from("bin_rotations")
      .select("*")
      .eq("property_id", property.id)
      .order("week_starting", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Determine next room in rotation
    let nextRoomIdx = 0;
    if (lastRotation) {
      const lastRoomIdx = rooms.findIndex(r => r.id === lastRotation.room_id);
      nextRoomIdx = (lastRoomIdx + 1) % rooms.length;
    }
    const nextRoom = rooms[nextRoomIdx];

    // Find lodger for next room
    const { data: tenancy } = await supabase
      .from("tenancies")
      .select("lodger_id")
      .eq("room_id", nextRoom.id)
      .eq("tenancy_status", "active")
      .maybeSingle();

    // Insert new bin_rotation and bin_duty_log
    const weekStarting = new Date();
    weekStarting.setHours(0, 0, 0, 0);

    await supabase.from("bin_rotations").insert([{
      property_id: property.id,
      room_id: nextRoom.id,
      lodger_id: tenancy?.lodger_id ?? null,
      week_starting: weekStarting.toISOString(),
      bin_duty_status: "assigned"
    }]);

    await supabase.from("bin_duty_logs").insert([{
      property_id: property.id,
      room_id: nextRoom.id,
      lodger_id: tenancy?.lodger_id ?? null,
      duty_date: weekStarting.toISOString(),
      status: "assigned"
    }]);
  }

  // 3. Send reminders for duties due tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const { data: dueLogs } = await supabase
    .from("bin_duty_logs")
    .select("id, lodger_id, duty_date")
    .eq("duty_date", tomorrow.toISOString().slice(0, 10))
    .eq("status", "assigned");

  for (const log of dueLogs ?? []) {
    if (!log.lodger_id) continue;
    await supabase.from("notifications").insert([{
      recipient_id: log.lodger_id,
      notification_type: "in_app",
      title: "Bin Duty Reminder",
      message: "You have a bin duty scheduled for tomorrow. Please remember to complete it.",
      sent_at: new Date().toISOString(),
      priority: "medium"
    }]);
  }

  // 4. Mark missed duties and apply penalty
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const { data: missedLogs } = await supabase
    .from("bin_duty_logs")
    .select("id, lodger_id, property_id, duty_date, status")
    .eq("duty_date", yesterday.toISOString().slice(0, 10))
    .eq("status", "assigned");

  for (const log of missedLogs ?? []) {
    // Mark as missed
    await supabase.from("bin_duty_logs").update({
      status: "missed"
    }).eq("id", log.id);

    // Apply extra charge if lodger exists
    if (log.lodger_id) {
      const { data: charge } = await supabase.from("extra_charges").insert([{
        lodger_id: log.lodger_id,
        property_id: log.property_id,
        charge_type: "bin_duty_missed",
        amount: penaltyFee,
        charge_status: "pending",
        charge_date: new Date().toISOString(),
        description: "Missed bin duty"
      }]).select("id").single();

      // Link charge to log
      if (charge?.id) {
        await supabase.from("bin_duty_logs").update({
          charge_applied: true,
          charge_id: charge.id
        }).eq("id", log.id);
      }
    }
  }

  return new Response(JSON.stringify({ status: "ok" }), { headers: { "Content-Type": "application/json" } });
});