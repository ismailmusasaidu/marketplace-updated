import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user already has a virtual account
    const { data: existingAccount } = await supabaseClient
      .from("virtual_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingAccount) {
      return new Response(
        JSON.stringify({
          success: true,
          data: existingAccount,
          message: "Virtual account already exists",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("Failed to get user profile");
    }

    // Step 1: Create or get Paystack customer
    const customerResponse = await fetch(
      "https://api.paystack.co/customer",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: profile.email,
          first_name: profile.full_name.split(" ")[0] || profile.full_name,
          last_name: profile.full_name.split(" ").slice(1).join(" ") || "User",
          metadata: {
            user_id: user.id,
          },
        }),
      }
    );

    const customerData = await customerResponse.json();

    if (!customerResponse.ok && customerResponse.status !== 400) {
      throw new Error(customerData.message || "Failed to create customer");
    }

    // If customer already exists, fetch customer details
    let customerCode = customerData.data?.customer_code;
    
    if (!customerCode) {
      // Try to get existing customer
      const getCustomerResponse = await fetch(
        `https://api.paystack.co/customer/${encodeURIComponent(profile.email)}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${paystackSecretKey}`,
          },
        }
      );

      const getCustomerData = await getCustomerResponse.json();
      
      if (getCustomerResponse.ok && getCustomerData.status) {
        customerCode = getCustomerData.data.customer_code;
      } else {
        throw new Error("Failed to get customer code");
      }
    }

    // Step 2: Create dedicated virtual account
    const dvaResponse = await fetch(
      "https://api.paystack.co/dedicated_account",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: customerCode,
          preferred_bank: "wema-bank",
        }),
      }
    );

    const dvaData = await dvaResponse.json();

    if (!dvaResponse.ok || !dvaData.status) {
      throw new Error(dvaData.message || "Failed to create virtual account");
    }

    const accountData = dvaData.data;

    // Step 3: Save to database
    const { data: newAccount, error: insertError } = await supabaseClient
      .from("virtual_accounts")
      .insert({
        user_id: user.id,
        customer_code: customerCode,
        account_number: accountData.account_number,
        account_name: accountData.account_name,
        bank_name: accountData.bank.name,
        bank_code: accountData.bank.id.toString(),
        assigned: accountData.assigned,
        active: accountData.active,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting virtual account:", insertError);
      throw new Error("Failed to save virtual account");
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: newAccount,
        message: "Virtual account created successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating virtual account:", error);
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
