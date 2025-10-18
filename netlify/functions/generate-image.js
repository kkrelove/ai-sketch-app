// A secure, server-side function to call the Google AI API

// We are using node-fetch version 2, which is compatible with Netlify Functions
const fetch = require('node-fetch');

exports.handler = async function(event) {
    // We only want to handle POST requests to this function
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { imageData } = JSON.parse(event.body);
        const apiKey = process.env.GEMINI_API_KEY;

        // *** THE CRITICAL FIX IS HERE ***
        // We are now pointing to the 'nano-banana' model designed for image-to-image generation
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{
                parts: [
                    // A simple instruction for the AI model
                    { text: "Turn this sketch into a high-quality, detailed image." },
                    // The user's sketch data
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: imageData
                        }
                    }
                ]
            }],
            generationConfig: {
                // We must explicitly tell this model we expect an image in the response
                responseModalities: ['IMAGE']
            },
        };

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error("Google AI API Error:", errorText);
            return { statusCode: apiResponse.status, body: JSON.stringify({ message: `Google AI API error: ${apiResponse.statusText}`, details: errorText }) };
        }

        const result = await apiResponse.json();

        // The image data is found in a specific part of the response
        const base64Data = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

        if (!base64Data) {
            console.error("No image data in API response:", JSON.stringify(result, null, 2));
            return { statusCode: 500, body: JSON.stringify({ message: "Failed to parse image from Google's response." }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ imageData: base64Data })
        };

    } catch (error) {
        console.error("Error in Netlify function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An internal server error occurred." })
        };
    }
};
