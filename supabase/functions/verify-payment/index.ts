import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  console.log("=== Paystack Callback Received ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!paystackSecretKey) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      throw new Error("Paystack secret key not configured");
    }

    const url = new URL(req.url);
    const reference = url.searchParams.get("reference");
    const paymentType = url.searchParams.get("type") || "wallet";
    console.log("Payment reference:", reference);
    console.log("Payment type:", paymentType);

    if (!reference) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment reference is required",
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

    console.log("Verifying payment with Paystack...");
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const paystackData = await paystackResponse.json();
    console.log("Paystack response status:", paystackData.status);
    console.log("Transaction status:", paystackData.data?.status);

    if (!paystackResponse.ok || !paystackData.status) {
      console.error("Paystack verification failed:", paystackData.message);
      throw new Error(paystackData.message || "Failed to verify payment");
    }

    const transactionData = paystackData.data;

    if (transactionData.status !== "success") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Payment was not successful",
          status: transactionData.status,
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

    const userId = transactionData.metadata?.user_id;
    const amount = transactionData.amount / 100;
    console.log("User ID:", userId, "Amount:", amount);

    if (!userId) {
      console.error("User ID not found in metadata");
      throw new Error("User ID not found in transaction metadata");
    }

    if (paymentType === "order") {
      console.log("✅ Order payment verified successfully (funds go to merchant)");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment verified successfully",
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: existingTransaction } = await supabaseClient
      .from("wallet_transactions")
      .select("id")
      .eq("reference_id", reference)
      .maybeSingle();

    if (existingTransaction) {
      console.log("Payment already processed, skipping");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment already processed",
          amount,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Crediting wallet...");

    const { data: walletData, error: walletError } = await supabaseClient.rpc(
      "credit_wallet",
      {
        p_user_id: userId,
        p_amount: amount,
        p_description: `Paystack payment - ${reference}`,
        p_reference_type: "topup",
        p_reference_id: reference,
      }
    );

    if (walletError) {
      console.error("Error crediting wallet:", walletError);
      throw new Error("Failed to credit wallet");
    }

    if (!walletData.success) {
      console.error("Failed to credit wallet:", walletData.error);
      throw new Error(walletData.error || "Failed to credit wallet");
    }

    console.log("✅ Wallet credited successfully!");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified and wallet credited successfully",
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
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({
        success: false,
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