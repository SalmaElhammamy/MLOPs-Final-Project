// Helper function: normalize landmarks before sending
function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length !== 21) {
    // Return empty or raw if incorrect input
    return landmarks;
  }

  // Step 1: Get wrist (landmark 0)
  const wrist = landmarks[0];

  // Step 2: Get mid-finger tip (landmark 9)
  const midFingerTip = landmarks[9];

  // Calculate scale:
  // Distance between wrist and mid-finger tip
  function distance3D(a, b) {
    return Math.sqrt(
      (a.x - b.x) ** 2 +
      (a.y - b.y) ** 2 +
      (a.z - b.z) ** 2
    );
  }

  const scale1 = distance3D(wrist, midFingerTip);

  // Max distance from wrist among all landmarks
  let maxDist = 0;
  for (const point of landmarks) {
    const dist = distance3D(wrist, point);
    if (dist > maxDist) maxDist = dist;
  }

  const scale = Math.max(scale1, maxDist);

  if (scale === 0 || isNaN(scale)) {
    // Avoid division by zero
    return landmarks.map(p => ({...p}));
  }

  // Normalize landmarks: (point - wrist) / scale
  const normalized = landmarks.map(point => ({
    x: (point.x - wrist.x) / scale,
    y: (point.y - wrist.y) / scale,
    z: (point.z - wrist.z) / scale,
  }));

  return normalized;
}

async function getPredictedLabel(processed_t) {
  try {
    // Normalize landmarks before flattening
    const normalizedLandmarks = normalizeLandmarks(processed_t);

    // Flatten normalized landmarks into array [x0, y0, z0, x1, y1, z1, ...]
    const flattenedData = [];
    for (let i = 0; i < normalizedLandmarks.length; i++) {
      const point = normalizedLandmarks[i];
      flattenedData.push(point.x, point.y, point.z);
    }

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

    console.log('Predicted label from API:', result.prediction);

    const validLabels = ["up", "down", "left", "right"];

    if (result.prediction && validLabels.includes(result.prediction.toLowerCase())) {
      return result.prediction.toLowerCase();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error calling prediction API:', error);
    return null;
  }
}
