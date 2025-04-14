// Direct test function for Google Sheets API
export const testGoogleSheets = async () => {
  try {
    // Use the API key and spreadsheet ID from the environment variables
    const spreadsheetId = process.env.REACT_APP_SPREADSHEET_ID;
    const apiKey = process.env.REACT_APP_GOOGLE_API_KEY;

    console.log('Test function called with:', { 
      spreadsheetId: spreadsheetId ? 'Spreadsheet ID exists' : 'No Spreadsheet ID found',
      apiKey: apiKey ? 'API key exists' : 'No API key found'
    });

    // Use the Google Sheets API v4 with API key
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Activities!A1:G?key=${apiKey}`;
    console.log('Test Request URL:', url);

    const response = await fetch(url);
    console.log('Test Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Test API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Test Response data:', data);

    if (!data.values) {
      console.warn('Test No data found in the spreadsheet');
      return null;
    }

    console.log('Test success! Data found:', data.values.length, 'rows');
    return data.values;
  } catch (error) {
    console.error('Test error fetching data:', error);
    return null;
  }
};