import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Paystack-Signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key not configured");
    }

    // Verify Paystack signature
    const signature = req.headers.get("x-paystack-signature");
    const body = await req.text();
    
    if (signature) {
      const hash = createHmac("sha512", paystackSecretKey)
        .update(body)
        .digest("hex");
      
      if (hash !== signature) {
        throw new Error("Invalid signature");
      }
    }

    const event = JSON.parse(body);

    console.log("Webhook event received:", event.event);

    // Create Supabase client with service role key for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle dedicated virtual account assignment
    if (event.event === "dedicatedaccount.assign.success") {
      const accountData = event.data;
      const customerCode = accountData.customer.customer_code;

      // Find user by customer_code
      const { data: virtualAccount } = await supabaseClient
        .from("virtual_accounts")
        .select("*")
        .eq("customer_code", customerCode)
        .single();

      if (virtualAccount) {
        // Update virtual account with assignment details
        await supabaseClient
          .from("virtual_accounts")
          .update({
            account_number: accountData.dedicated_account.account_number,
            account_name: accountData.dedicated_account.account_name,
            bank_name: accountData.dedicated_account.bank.name,
            bank_code: accountData.dedicated_account.bank.id.toString(),
            assigned: accountData.dedicated_account.assigned,
            active: accountData.dedicated_account.active,
          })
          .eq("customer_code", customerCode);

        console.log("Virtual account updated successfully");
      }
    }

    // Handle successful charge (when money is transferred to virtual account)
    if (event.event === "charge.success") {
      const chargeData = event.data;

      // Check if this is a transfer to virtual account
      if (chargeData.channel === "dedicated_nuban") {
        const customerCode = chargeData.customer.customer_code;
        const amount = chargeData.amount / 100; // Convert from kobo to naira
        const reference = chargeData.reference;

        // Find user by customer_code
        const { data: virtualAccount } = await supabaseClient
          .from("virtual_accounts")
          .select("user_id")
          .eq("customer_code", customerCode)
          .single();

        if (!virtualAccount) {
          throw new Error("Virtual account not found");
        }

        // Check if this transaction has already been processed
        const { data: existingTransaction } = await supabaseClient
          .from("wallet_transactions")
          .select("id")
          .eq("reference_id", reference)
          .single();

        if (existingTransaction) {
          console.log("Transaction already processed:", reference);
          return new Response(
            JSON.stringify({ message: "Transaction already processed" }),
            {
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        // Credit user's wallet
        const { data: creditResult, error: creditError } = await supabaseClient.rpc(
          "credit_wallet",
          {
            p_user_id: virtualAccount.user_id,
            p_amount: amount,
            p_description: `Wallet funding via bank transfer`,
            p_reference_type: "topup",
            p_reference_id: reference,
          }
        );

        if (creditError) {
          console.error("Error crediting wallet:", creditError);
          throw creditError;
        }

        if (!creditResult.success) {
          throw new Error(creditResult.error || "Failed to credit wallet");
        }

        console.log(`Wallet credited: ₦${amount} for user ${virtualAccount.user_id}`);

        return new Response(
          JSON.stringify({
            message: "Wallet credited successfully",
            amount,
            reference,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // Return success for all other events
    return new Response(
      JSON.stringify({ message: "Webhook received" }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
