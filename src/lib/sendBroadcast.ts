import { supabase } from "@/lib/supabaseClient";

interface EmailPayload {
  to: string[]; // List of email addresses
  subject: string;
  message: string;
}

/**
 * Sends a broadcast email via the 'send-broadcast' Edge Function.
 */
export const sendEmailBroadcast = async ({ to, subject, message }: EmailPayload) => {
  // 1. Basic Validation
  if (!to || to.length === 0) {
    return { success: false, error: "No recipients provided" };
  }

  // 2. Call Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('send-broadcast', {
    body: {
      emails: to,
      subject,
      message
    }
  });

  // 3. Handle Network/Function Errors
  if (error) {
    console.error("Edge Function Error:", error);
    return { success: false, error: error.message };
  }

  // 4. Handle Logic Errors (from the function itself)
  if (data?.error) {
    console.error("SendGrid Logic Error:", data.error);
    return { success: false, error: data.error };
  }

  return { success: true, count: data?.count || 0 };
};