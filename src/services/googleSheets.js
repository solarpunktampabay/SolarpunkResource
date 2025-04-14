// Simple fetch function to get data from Google Sheets
export const fetchActivities = async () => {
  try {
    // Access environment variables using import.meta.env for Vite
    const spreadsheetId = import.meta.env.VITE_SPREADSHEET_ID;
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    
    // Debug environment variables
    console.log('VITE_SPREADSHEET_ID:', spreadsheetId);
    console.log('VITE_GOOGLE_API_KEY exists:', !!apiKey);
    
    if (!spreadsheetId || spreadsheetId === 'your_spreadsheet_id_here') {
      console.error('Missing valid spreadsheet ID - using mock data');
      return mockData;
    }
    
    if (!apiKey || apiKey === 'your_api_key_here') {
      console.error('Missing valid API key - using mock data');
      return mockData;
    }
    
    console.log('Fetching data with:', { 
      spreadsheetId, 
      apiKey: apiKey ? 'API key exists' : 'No API key found',
    });
    
    // Category mapping - convert abbreviated categories to full ones
    const categoryMapping = {
      'Internship': 'Internship, Grant, Job Opportunity, Graduate School',
      'Home': 'Upgrade your Home',
      'Work': 'At work',
      'Community': 'Community Engagement',
      'Waste': 'Waste Reduction/ Disposal',
      'Government': 'Government',
      'USF': 'USF Specific (Go Bulls!)',
      'Donate': 'Donate/ Use your Resources',
      'Entertainment': 'Entertainment, Utility, Education, News'
    };
    
    // Use the Google Sheets API v4 with API key
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Activities!A1:H?key=${apiKey}`;
    console.log('Request URL:', url);
    
    const response = await fetch(url);
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Raw response data:', data);
    
    if (!data.values) {
      console.warn('No data found in the spreadsheet. Response:', data);
      return mockData;
    }
    
    if (data.values.length <= 1) {
      console.warn('Spreadsheet has only headers or is empty');
      return mockData;
    }
    
    // Log the headers and first few rows of data
    console.log('Headers:', data.values[0]);
    console.log('First row:', data.values[1]);
    if (data.values.length > 2) {
      console.log('Second row:', data.values[2]);
    }
    
    // Skip the first row (headers) and process the rest
    const processedData = data.values.slice(1).map((row, index) => {
      // Get the short category from the spreadsheet
      const shortCategory = row[1] || '';
      console.log(`Row ${index + 1} has short category:`, shortCategory);
      
      // Convert to full category name using the mapping
      const fullCategory = categoryMapping[shortCategory] || shortCategory;
      console.log(`Row ${index + 1} mapped to full category:`, fullCategory);
      
      const item = {
        id: (index + 1).toString(),
        name: row[0] || '',
        categories: [fullCategory],
        subcategory: row[2] || '',
        location: row[3] || '',
        description: row[4] || '',
        tags: (row[5] || '').split(',').map(tag => tag.trim()).filter(Boolean),
        websiteUrl: row[6] || '',
        expiredDate: row[7] || '',
      };


      
      console.log(`Processed item ${index + 1}:`, item);
      return item;
    });
    
    console.log('Final processed data:', processedData);
    return processedData;
  } catch (error) {
    console.error('Error fetching activities:', error);
    return mockData; // Fallback to mock data if there's an error
  }
};

// Mock data for development
const mockData = [
  {
    id: 1,
    name: "Local Community Garden",
    categories: ["Upgrade your Health", "Upgrade your Relationships"],
    subcategory: "Community",
    location: "Downtown",
    description: "Join our community garden project. Learn about sustainable gardening, meet neighbors, and grow your own vegetables.",
    tags: ["sustainability", "community", "health"],
    websiteUrl: "https://example.com/garden"
  },
  {
    id: 2,
    name: "Tech Skills Workshop",
    categories: ["Upgrade your Skills", "Internship, Grant, Job Opportunity, Graduate School"],
    subcategory: "Technical Skills",
    location: "Online",
    description: "Learn in-demand tech skills through hands-on workshops. Perfect for career changers and skill upgraders.",
    tags: ["technology", "career", "education"],
    websiteUrl: "https://example.com/tech-workshop"
  }
];