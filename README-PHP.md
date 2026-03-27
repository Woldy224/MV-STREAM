# MV-STREAM - PHP Video Streaming Platform

A premium video streaming platform built with PHP, HTML, CSS, and JavaScript featuring a luxurious black & gold color scheme.

## Features

- **User Authentication**: Sign up, login, and logout functionality with Supabase
- **Content Browsing**: Browse movies and series with filters
- **Live TV**: Watch live TV channels
- **Video Player**: Custom video player with controls
- **User Profiles**: Manage user profiles and watch history
- **Subscription Plans**: Multiple subscription tiers
- **Admin Dashboard**: Content and user management for administrators
- **Responsive Design**: Mobile-friendly interface
- **Black & Gold Theme**: Premium, luxurious color scheme

## Technology Stack

- **Backend**: PHP 7.4+
- **Database**: Supabase (PostgreSQL)
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Icons**: Font Awesome 6
- **Images**: Pexels stock photos

## Installation

### Requirements

- PHP 7.4 or higher
- Apache web server with mod_rewrite enabled
- Supabase account

### Setup Steps

1. **Clone or download the project**

2. **Configure Apache**
   - Ensure mod_rewrite is enabled
   - Point your document root to the project folder
   - Ensure .htaccess files are processed

3. **Environment Variables**
   - The Supabase configuration is already set in the `.env` file
   - Update if needed with your own Supabase credentials

4. **File Permissions**
   - Ensure the web server has read access to all files
   - Set proper permissions: `chmod 755` for directories, `chmod 644` for files

5. **Access the application**
   - Navigate to `http://localhost/` (or your configured domain)

## Project Structure

```
/
├── config/
│   ├── auth.php         # Authentication handler
│   └── database.php     # Database connection
├── includes/
│   ├── header.php       # Site header
│   └── footer.php       # Site footer
├── admin/
│   └── dashboard.php    # Admin dashboard
├── assets/
│   ├── css/
│   │   └── styles.css   # Main stylesheet (Black & Gold theme)
│   └── js/
│       ├── main.js      # Core JavaScript
│       ├── home.js      # Homepage functionality
│       ├── browse.js    # Browse page functionality
│       ├── live-tv.js   # Live TV functionality
│       └── watch.js     # Video player functionality
├── index.php            # Homepage
├── login.php            # Login page
├── register.php         # Registration page
├── browse.php           # Browse content
├── live-tv.php          # Live TV channels
├── watch.php            # Video player
├── profile.php          # User profile
├── subscription.php     # Subscription plans
├── logout.php           # Logout handler
└── .htaccess            # Apache configuration
```

## Color Scheme

The MV-STREAM platform uses a premium black & gold color palette:

- **Primary Black**: #000000
- **Dark Gray**: #0a0a0a
- **Medium Gray**: #1a1a1a
- **Light Gray**: #2a2a2a
- **Gold**: #d4af37
- **Gold Dark**: #b8941f
- **Gold Light**: #f4d976

## Pages

### Public Pages
- **Home** (`index.php`): Featured content and trending sliders
- **Browse** (`browse.php`): Search and filter content
- **Live TV** (`live-tv.php`): Live channel listings
- **Login** (`login.php`): User authentication
- **Register** (`register.php`): New user registration

### Protected Pages (Require Authentication)
- **Profile** (`profile.php`): User account management
- **Subscription** (`subscription.php`): Plan management
- **Watch** (`watch.php`): Video player
- **Admin Dashboard** (`admin/dashboard.php`): Admin controls

## Authentication

The platform uses Supabase for authentication:

- Email/password authentication
- Session management
- Protected routes
- Admin role checking

## Database

Using Supabase PostgreSQL database with:
- User authentication tables
- Content metadata
- User preferences
- Watch history

## Development

To modify the site:

1. **Styling**: Edit `assets/css/styles.css` for visual changes
2. **JavaScript**: Edit files in `assets/js/` for functionality
3. **Pages**: Edit PHP files in the root directory
4. **Authentication**: Modify `config/auth.php`
5. **Database**: Update `config/database.php`

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- Session-based authentication
- CSRF protection
- SQL injection prevention via Supabase
- XSS prevention with htmlspecialchars()
- Protected admin routes

## License

All rights reserved © 2024 MV-STREAM

## Support

For issues or questions, please contact the development team.
