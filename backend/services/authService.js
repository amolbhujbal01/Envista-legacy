const AwsConfig = require("../config/cognitoConfig");
const dbService = require("../services/dbService");

function generateRandomId() {
  return Math.floor(100 + Math.random() * 900);
}

async function signUp(email, password, name, agent = "none") {
  return new Promise(async (resolve) => {
    try {
      // Email validation using regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return resolve({
          statusCode: 400,
          response: {
            error:
              "Invalid email format. Please provide a valid email address.",
          },
        });
      }

      // List of allowed domains
      const allowedDomains = [
        "envistaco.com",
        // "envista.com",
        // "nobel.com",
        "zimetrics.com"
      ];
      const emailDomain = email.split("@")[1];
      if (!allowedDomains.includes(emailDomain)) {
        return resolve({
          statusCode: 403,
          response: {
            error:
              "Not a trusted organization. Please use an email from a trusted domain.",
          },
        });
      }

      // Initialize AWS and configure attributes
      AwsConfig.initAWS();
      AwsConfig.setCognitoAttributeList(email, name, agent);

      // Sign up the user
      AwsConfig.getUserPool().signUp(
        email,
        password,
        AwsConfig.getCognitoAttributeList(),
        null,
        async function (err, result) {
          if (err) {
            // Detailed error handling
            let errorMessage = "An unknown error occurred.";
            if (err.code) {
              switch (err.code) {
                case "UsernameExistsException":
                  errorMessage = "The email address is already in use.";
                  break;
                case "InvalidPasswordException":
                  errorMessage = "The password provided is not valid.";
                  break;
                case "InvalidParameterException":
                  errorMessage = "One or more parameters are invalid.";
                  break;
                case "LimitExceededException":
                  errorMessage = "The request rate is too high.";
                  break;
                default:
                  errorMessage = `Error: ${err.message}`;
                  break;
              }
            }
            return resolve({
              statusCode: 422,
              response: { error: errorMessage, details: err },
            });
          }

          // Store user information in the RDS database
          try {
            const tenantId = result.userSub; // Use userSub as tenantId
            const status = "active"; // Example status

            // Insert user into User table
            const userInsertResult = await dbService.query(
              `INSERT INTO User (tenant_id, name, email, status) VALUES (?, ?, ?, ?)`,
              [tenantId, name, email, status]
            );

            // Retrieve the user_id of the newly inserted user
            const userSelectResult = await dbService.query(
              `SELECT user_id FROM User WHERE email = ?`,
              [email]
            );

            const userId = userSelectResult[0].user_id;

            // Generate a unique practice_id
            let practiceId;
            let isUnique = false;

            while (!isUnique) {
              practiceId = generateRandomId(); // Example practice_id, change as necessary
              const practiceCheckResult = await dbService.query(
                `SELECT COUNT(*) AS count FROM UserPractice WHERE practice_id = ?`,
                [practiceId]
              );
              if (practiceCheckResult[0].count === 0) {
                isUnique = true;
              }
            }

            const loginId = email; // Assuming login_id is the same as user_id

            // Insert user into UserPractice table
            const userPracticeInsertResult = await dbService.query(
              `INSERT INTO UserPractice (tenant_id, practice_id, user_id, login_id, status) VALUES (?, ?, ?, ?, ?)`,
              [tenantId, practiceId, userId, loginId, status]
            );

            // Insert into Dental_Practice table
            const dentalPracticeId = 1; // Example dental_practice_id
            const dsoId = 1; // Example dso_id, change as necessary
            const dentalPracticeName = "Healthy Smiles Dental";
            const dentalPracticeEmail = "info@healthysmiles.com";
            const dentalPracticePhone = "555-1234";
            const dentalPracticeAddress =
              "123 Wellness Lane, City, State, 12345";

            const dentalPracticeInsertResult = await dbService.query(
              `INSERT INTO Dental_Practice (tenant_id, dental_practice_id, dso_id, name, practice_id, email, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                tenantId,
                dentalPracticeId,
                dsoId,
                dentalPracticeName,
                practiceId,
                dentalPracticeEmail,
                dentalPracticePhone,
                dentalPracticeAddress,
              ]
            );

            // Success response
            const response = {
              username: result.user.username,
              userConfirmed: result.userConfirmed,
              userAgent: result.user.client.userAgent,
            };
            return resolve({ statusCode: 201, response: response });
          } catch (dbError) {
            console.log("Error: ", dbError);
            return resolve({
              statusCode: 500,
              response: {
                error: "Oops! Something went wrong, please try again later.",
                details: dbError,
              },
            });
          }
        }
      );
    } catch (error) {
      // Handle any unexpected errors
      return resolve({
        statusCode: 500,
        response: { error: "An unexpected error occurred.", details: error },
      });
    }
  });
}

function verify(email, code, password) {
  return new Promise(async (resolve) => {
    AwsConfig.getCognitoUser(email).confirmRegistration(
      code,
      true,
      async (err, result) => {
        if (err) {
          return resolve({ statusCode: 422, response: err });
        }
        // Automatically sign in the user after verification
        const signInResponse = await signIn(email, password); // Assuming password is available
        return resolve({
          statusCode: 200,
          response: { verifyResult: result, signInResult: signInResponse },
        });
      }
    );
  });
}

function signIn(email, password) {
  return new Promise((resolve) => {
    AwsConfig.getCognitoUser(email).authenticateUser(
      AwsConfig.getAuthDetails(email, password),
      {
        onSuccess: (result) => {
          const token = {
            accessToken: result.getAccessToken().getJwtToken(),
            idToken: result.getIdToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken(),
          };
          return resolve({
            statusCode: 200,
            response: AwsConfig.decodeJWTToken(token),
          });
        },

        onFailure: (err) => {
          return resolve({
            statusCode: 400,
            response: err.message || JSON.stringify(err),
          });
        },
      }
    );
  });
}

module.exports = {
  signUp,
  verify,
  signIn,
};
