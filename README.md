# Scratch Card Application

This project is a scratch card application that reveals a randomly generated coupon code when scratched. It is designed for both mobile and desktop users, providing an interactive experience.

## Features

- Interactive scratch card that reveals a coupon code.
- Random coupon code generation.
- User session management with local storage.
- Responsive design for mobile and desktop.

## Project Structure

```
scratch-card-app
├── public
│   ├── index.html        # HTML structure for the application
│   └── styles.css       # Styles for the scratch card
├── src
│   ├── app.js           # Entry point of the application
│   ├── scratchCard.js    # Scratch card functionality
│   ├── couponGenerator.js # Coupon code generation
│   └── db
│       └── localDatabase.js # Local database interactions
├── package.json         # npm configuration file
└── README.md            # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd scratch-card-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Open `public/index.html` in a web browser.
2. Interact with the scratch card by clicking and dragging the mouse or swiping on a mobile device.
3. The coupon code will be revealed upon scratching.

## License

This project is licensed under the MIT License.