# Practical Connections

A web application for exploring and searching activities based on categories and tags.

## Features

- Browse activities by main categories
- View subcategories in an accordion format
- Search activities by name or description
- Filter activities by tags
- Responsive design with Tailwind CSS
- Google Sheets integration for data management

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Cloud Platform account
- Google Sheets API enabled

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd practical-connections
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google Sheets API:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Sheets API
   - Create credentials (Service Account)
   - Download the credentials JSON file
   - Share your Google Sheet with the service account email

4. Create a `.env` file in the root directory:
```env
REACT_APP_SPREADSHEET_ID=your_spreadsheet_id_here
REACT_APP_GOOGLE_APPLICATION_CREDENTIALS=path_to_your_credentials.json
```

5. Start the development server:
```bash
npm start
```

## Google Sheets Structure

Your Google Sheet should have the following columns:
- ID (unique identifier)
- Name (activity name)
- Category (main category)
- Subcategory (subcategory)
- Location
- Description
- Tags (comma-separated)
- Image URL

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm test`: Launches the test runner
- `npm run build`: Builds the app for production
- `npm run eject`: Ejects from Create React App

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 