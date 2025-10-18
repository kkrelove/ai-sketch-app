// IMPORTANT: To make this work, you need to install node-fetch
// by creating a package.json file and adding it as a dependency.
// In your project root, run:
// npm init -y
// npm install node-fetch


const fetch = require('node-fetch');


exports.handler = async (event) => {
   // Only allow POST requests
   if (event.httpMethod !== 'POST') {
       return { statusCode: 405, body: 'Method Not Allowed' };
   }


   try {
       const { imageData } = JSON.parse(event.body);
      
       // This is where you securely access your API key
       const apiKey = process.env.GEMINI_API_KEY;


       if (!apiKey) {
           throw new Error("API key is not set in environment variables.");
       }


       const model = 'gemini-2.5-flash-image-preview';
       const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;


       const payload = {
           contents: [{
               parts: [
                   { text: "Turn this simple sketch into a detailed, photorealistic image. Interpret the drawing and expand upon it creatively." },
                   {
                       inlineData: {
                           mimeType: 'image/png',
                           data: imageData
                       }
                   }
               ]
           }],
           generationConfig: {
               responseModalities: ['TEXT', 'IMAGE']
           },
       };


       const apiResponse = await fetch(apiUrl, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
       });


       if (!apiResponse.ok) {
           const errorBody = await apiResponse.text();
           console.error('Google AI API Error:', errorBody);
           return {
               statusCode: apiResponse.status,
               body: JSON.stringify({ message: `Google AI API error: ${apiResponse.statusText}` })
           };
       }


       const result = await apiResponse.json();
       const imagePart = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
       const base64Data = imagePart?.inlineData?.data;


       if (!base64Data) {
           return {
               statusCode: 500,
               body: JSON.stringify({ message: "No image data found in Google's response." })
           };
       }


       return {
           statusCode: 200,
           body: JSON.stringify({ imageData: base64Data })
       };


   } catch (error) {
       console.error('Error in serverless function:', error);
       return {
           statusCode: 500,
           body: JSON.stringify({ message: error.message || 'An internal server error occurred.' })
       };
   }
};