/*
  Bin Rotation Scheduler (template)
  - Install: npm i @supabase/supabase-js
  - Usage: SUPABASE_URL=... SUPABASE_KEY=... node scripts/bin_rotation_scheduler.js

  This script is a template showing the logic to run daily (cron) and:
  - For each property with a `bin_collection_day`, determine if a new rotation week should be created
  - Advance the rotation by inserting next week's `bin_rotations` entries based on tenancies
  - Send in-app notifications (insert into `notifications`) and optionally trigger SMS via third-party

  Customize and deploy as a Supabase Edge Function, server cron, or other scheduler.
*/

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY env vars');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  // fetch properties with collection days
  const { data: days, error: daysErr } = await supabase.from('bin_collection_day').select('property_id, day_of_week');
  if (daysErr) { console.error('Failed to load bin_collection_day', daysErr); return; }

  for (const d of days || []) {
    try {
      // find the most recent rotation for this property
      const { data: recent, error: rErr } = await supabase.from('bin_rotations').select('week_starting').eq('property_id', d.property_id).order('week_starting', { ascending: false }).limit(1).maybeSingle();
      if (rErr) throw rErr;
      const nextStart = computeNextStartFromReference(d.day_of_week, recent?.week_starting);
      // check if we already have a rotation for nextStart
      const { data: exists } = await supabase.from('bin_rotations').select('id').eq('property_id', d.property_id).eq('week_starting', nextStart);
      if (exists && exists.length) { console.log('Rotation already exists for', d.property_id, nextStart); continue; }

      // fetch active tenancies for property ordered by room
      const { data: tenancies } = await supabase.from('tenancies').select('id, room:rooms(id, room_number), lodger:lodger_profiles(id, full_name)').eq('property_id', d.property_id).eq('tenancy_status', 'active').order('room.room_number', { foreignTable: 'rooms', ascending: true });
      if (!tenancies || !tenancies.length) { console.log('No tenancies for', d.property_id); continue; }

      // create one-week-per-tenancy rotation entries starting at nextStart
      const inserts = [];
      for (let i = 0; i < tenancies.length; i++) {
        const t = tenancies[i];
        const start = new Date(nextStart);
        start.setDate(start.getDate() + i * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        inserts.push({
          tenancy_id: t.id,
          property_id: d.property_id,
          room_id: Array.isArray(t.room) ? t.room[0].id : t.room?.id,
          lodger_id: Array.isArray(t.lodger) ? t.lodger[0].id : t.lodger?.id,
          week_starting: start.toISOString(),
          week_ending: end.toISOString(),
          bin_duty_status: 'assigned',
        });
      }
      const { error: insErr } = await supabase.from('bin_rotations').insert(inserts);
      if (insErr) throw insErr;

      // send reminders for nextStart entries one day before (this script should be run daily and detect "tomorrow")
      // For each newly created rotation where week_starting is tomorrow, insert notification for lodger
      // (Notification fields: recipient_id => profile.user_id; subject; message_body)

      console.log('Initialized rotation for property', d.property_id);
    } catch (e) {
      console.error('Failed for property', d.property_id, e);
    }
  }
}

function computeNextStartFromReference(targetWeekday, lastWeekStartingIso) {
  const today = new Date();
  // If lastWeekStarting provided, compute last + 7 days
  if (lastWeekStartingIso) {
    const last = new Date(lastWeekStartingIso);
    last.setDate(last.getDate() + 7);
    return last.toISOString();
  }
  // otherwise compute next occurrence of targetWeekday
  const diff = (targetWeekday + 7 - today.getDay()) % 7;
  const next = new Date(today);
  next.setDate(today.getDate() + (diff === 0 ? 7 : diff));
  next.setHours(0,0,0,0);
  return next.toISOString();
}

run().then(() => console.log('Done')).catch(e => console.error(e));
