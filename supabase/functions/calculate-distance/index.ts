import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { origin, destination } = await req.json();

    if (!origin || !destination) {
      return new Response(
        JSON.stringify({ error: 'Missing origin or destination' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!googleMapsApiKey) {
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${googleMapsApiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to calculate distance');
    }

    const data = await response.json();

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.status === 'OK') {
      const distanceInMeters = data.rows[0].elements[0].distance.value;
      const distanceInKm = distanceInMeters / 1000;
      const durationInSeconds = data.rows[0].elements[0].duration.value;
      const durationText = data.rows[0].elements[0].duration.text;

      return new Response(
        JSON.stringify({ 
          success: true,
          distanceKm: distanceInKm,
          distanceText: data.rows[0].elements[0].distance.text,
          durationSeconds: durationInSeconds,
          durationText: durationText
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          error: 'Address not found or unreachable',
          status: data.rows?.[0]?.elements?.[0]?.status || data.status
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});