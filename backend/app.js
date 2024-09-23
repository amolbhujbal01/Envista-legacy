require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const uploadRoutes = require('./routes/fileActionsRoutes');
const patientRoutes = require('./routes/patientRoutes');
const treatmentJourneyRoutes = require('./routes/treatmentJourneyRoutes');
const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const cognitoMiddleware = require('./middlewares/cognitoMiddleware');

const app = express();
const port = process.env.PORT || 3000;

// const allowedOrigins = ['http://localhost:5173', process.env.FRONTEND_URL];

// // Configure CORS
// const corsOptions = {
//   origin: (origin, callback) => {
//     // Check if the incoming origin is in the allowed origins list or if it's undefined (for non-CORS requests)
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   }
// };

// Use the CORS middleware with the specified options
app.use(cors());
// Security middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per window
// });
// app.use(limiter);

app.use('/api/filesaction', cognitoMiddleware, uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patient', cognitoMiddleware, patientRoutes);
app.use('/api/treatmentjourneys', cognitoMiddleware, treatmentJourneyRoutes);
app.use('/api/workflows', cognitoMiddleware, workflowRoutes);
app.use('/api/servicerequests', cognitoMiddleware, serviceRequestRoutes);

app.use("/health", (req, res) => {
  res.status(200).send('Service is running');
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on("unhandledRejection", (err, promise) => {
  console.log(`Logged Error: ${err.message}`);
  server.close(() => process.exit(1));
});