# SplitTheBill

A modern, responsive web application for splitting bills and managing group expenses with friends, family, or colleagues.

## Features

- **Easy Bill Splitting**: Quickly divide expenses among group members
- **Group Management**: Create and manage expense groups
- **Multi-language Support**: Available in English, Spanish, French, German, Italian, Portuguese, and Chinese
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Progressive Web App**: Install and use offline
- **PDF Export**: Generate and download expense reports
- **Firebase Integration**: Secure authentication and real-time data sync

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore Database)
- **PWA**: Service Worker for offline functionality
- **PDF Generation**: jsPDF library
- **Internationalization**: Custom i18n implementation

## Getting Started

### Prerequisites

- A modern web browser
- Firebase project (for authentication and database)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Saurav372/SplitTheBill.git
   cd SplitTheBill
   ```

2. Configure Firebase:
   - Update `js/firebase-config.js` with your Firebase configuration

3. Serve the application:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

4. Open your browser and navigate to `http://localhost:8000`

## Project Structure

```
├── assets/                 # Static assets (images, icons, translations)
├── css/                   # Stylesheets
├── js/                    # JavaScript modules
├── index.html            # Landing page
├── auth.html             # Authentication page
├── dashboard.html        # Main application dashboard
├── faq.html              # FAQ page
├── manifest.json         # PWA manifest
└── sw.js                 # Service worker
```

## Usage

1. **Sign Up/Login**: Create an account or sign in with existing credentials
2. **Create Group**: Start a new expense group and invite members
3. **Add Expenses**: Record expenses and specify who paid and who owes
4. **View Balances**: See who owes what to whom
5. **Export Reports**: Generate PDF reports of group expenses

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please open an issue on GitHub.