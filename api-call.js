async function getPredictedLabel(processed_t) {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Starting prediction...`);
    console.log(`[${new Date().toLocaleTimeString()}] Input processed_t:`, processed_t);
    console.log(`[${new Date().toLocaleTimeString()}] Input length:`, processed_t.length);

    // Validate input
    if (!processed_t || processed_t.length !== 21) {
      console.error('Invalid input: Expected 21 landmarks, got:', processed_t?.length);
      return null;
    }

    // Flatten the landmarks array with better error handling
    const flattenedData = [];
    for (let i = 0; i < processed_t.length; i++) {
      const point = processed_t[i];
      
      // Validate each point has required properties
      if (!point || typeof point.x !== 'number' || typeof point.y !== 'number' || typeof point.z !== 'number') {
        console.error(`Invalid landmark at index ${i}:`, point);
        return null;
      }
      
      // Add coordinates in order: x, y, z
      flattenedData.push(point.x, point.y, point.z);
    }

    console.log(`[${new Date().toLocaleTimeString()}] Flattened data length:`, flattenedData.length);
    console.log(`[${new Date().toLocaleTimeString()}] First few values:`, flattenedData.slice(0, 9));
    
    // Additional preprocessing that might be needed
    // Normalize coordinates relative to wrist (landmark 0) - this is common in hand gesture recognition
    const wrist = processed_t[0];
    const normalizedData = [];
    
    for (let i = 0; i < processed_t.length; i++) {
      const point = processed_t[i];
      normalizedData.push(
        point.x - wrist.x,  // Relative x
        point.y - wrist.y,  // Relative y
        point.z - wrist.z   // Relative z
      );
    }
    
    console.log(`[${new Date().toLocaleTimeString()}] Normalized data (first 9):`, normalizedData.slice(0, 9));
    
    // Try both approaches - let's start with the normalized approach since it's more common
    const dataToSend = normalizedData;
    
    console.log(`[${new Date().toLocaleTimeString()}] Making API call to backend...`);

    // Call your backend API
    const response = await fetch('https://idmiunzktedg.us-east-1.clawcloudrun.com/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ landmarks: dataToSend })
    });

    if (!response.ok) {
      console.error('API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return null;
    }

    const result = await response.json();
    console.log(`[${new Date().toLocaleTimeString()}] Full API response:`, result);
    console.log(`[${new Date().toLocaleTimeString()}] Predicted direction from API:`, result.prediction);

    // Return one of the labels expected by the frontend or null if unknown
    const validLabels = ["up", "down", "left", "right"];
    if (validLabels.includes(result.prediction)) {
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Valid prediction:`, result.prediction);
      return result.prediction;
    } else {
      console.log(`[${new Date().toLocaleTimeString()}] ❌ Invalid prediction:`, result.prediction);
      return null;
    }

  } catch (error) {
    console.error('Error calling prediction API:', error);
    return null;
  }
}

// Alternative function to try if the first approach doesn't work
async function getPredictedLabelAlternative(processed_t) {
  try {
    console.log(`[${new Date().toLocaleTimeString()}] Trying alternative approach...`);
    
    if (!processed_t || processed_t.length !== 21) {
      console.error('Invalid input: Expected 21 landmarks, got:', processed_t?.length);
      return null;
    }

    // Try absolute coordinates (original approach)
    const flattenedData = [];
    for (let i = 0; i < processed_t.length; i++) {
      const point = processed_t[i];
      flattenedData.push(point.x, point.y, point.z);
    }

    console.log(`[${new Date().toLocaleTimeString()}] Alternative - using absolute coordinates`);
    
    const response = await fetch('https://idmiunzktedg.us-east-1.clawcloudrun.com/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ landmarks: flattenedData })
    });

    if (!response.ok) {
      console.error('API error:', response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    console.log(`[${new Date().toLocaleTimeString()}] Alternative API response:`, result);

    const validLabels = ["up", "down", "left", "right"];
    return validLabels.includes(result.prediction) ? result.prediction : null;

  } catch (error) {
    console.error('Error in alternative prediction API:', error);
    return null;
  }
}

// Function to test both approaches
async function getPredictedLabelWithFallback(processed_t) {
  // Try normalized approach first
  let prediction = await getPredictedLabel(processed_t);
  
  // If we get 'down' for everything or null, try the alternative
  if (!prediction || prediction === 'down') {
    console.log(`[${new Date().toLocaleTimeString()}] Trying alternative approach...`);
    const altPrediction = await getPredictedLabelAlternative(processed_t);
    if (altPrediction && altPrediction !== 'down') {
      return altPrediction;
    }
  }
  
  return prediction;
}