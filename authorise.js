const jwt = require("jsonwebtoken");

function authorize(req, res, next) {
    // Get the token from the request headers
    const auth = req.headers['authorization'];
    console.log('Headers:', req.headers);
    console.log('Token:', auth);

    // Check if token is missing
    if (!auth) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    try {
      // Verify the token using the secret key
      const decoded = jwt.verify(auth.split(' ')[1], `${process.env.TOKEN_SECRET}`);
      console.log('Decoded Token:', decoded);

      // Check if the user has the required role (type "admin")
      if (decoded.type !== "user") {
        return res.status(403).json({ error: "Forbidden: Access denied" });
      }

      // Attach the user information to the request object
      req.user = decoded;
      console.log('User Information:', req.user);

      // Move to the next middleware or route handler
      next();
    } catch (error) {
      // If token is invalid, return an error response
      console.error('Error decoding token:', error.message);

      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
}

module.exports = authorize;

