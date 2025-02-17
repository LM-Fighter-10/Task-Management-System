const {
  User
} = require("../db/Database");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Secret_Key, Email, EMAIL_PASSWORD } = require("../../env");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const {jwtDecode} = require("jwt-decode");
const sanitizeHtml = require("sanitize-html");

// Email configuration (you might want to use environment variables for this)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465, // Secure port for SSL
  secure: true, // Use SSL
  // service: "gmail",  Or any other email provider
  auth: {
    user: Email, // Set in .env file, // Replace with your email
    pass: EMAIL_PASSWORD, // Replace with your email password or app-specific password
  },
  // logger: true, // Enable logging
  // debug: true, // Enable debugging
  tls: {
    rejectUnauthorized: false, // If you encounter TLS errors
  },
});

function emailAcceptance(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function passwordAcceptance(password) {
  const passwordRegex =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-])[A-Za-z\d@$!%*?&\-]{8,}$/;
  return passwordRegex.test(String(password));
}

function usernameAcceptance(username) {
  if (username.length < 4) return { isValid: false, error: "Min 4 characters" };
  if (!/[a-z]/.test(username)) return { isValid: false, error: "Must include a lowercase letter" };
  if (!/^[a-z0-9_\-]+$/.test(username)) return { isValid: false, error: "Only a-z, 0-9, _ , -" };
  return { isValid: true, error: null };
}

// Function to check for potential injection attempts
function isInjectionAttempt(input) {
  const injectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|EXEC|UNION|SLEEP|OUTFILE|SCRIPT|IFRAME|ALERT|ONERROR|ONLOAD)\b|--|\/\*|\*\/|;|\||`)/gi;
  return injectionPattern.test(input);
}

// Function to sanitize message
function sanitizeMessage(message) {
  return sanitizeHtml(message, {
    allowedTags: [], // Remove all HTML tags
    allowedAttributes: {}, // Remove all attributes
  });
}

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validate the username
    if (!username) {
      return res.status(200).json({ error: "Username is required" });
    }
    // Validate the password
    if (!password) {
      return res.status(200).json({ error: "Password is required" });
    }
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(200).json({ error: "Invalid username" });
    } else if (!(await bcrypt.compare(password, user.password))) {
      return res.status(200).json({ error: "Invalid password" });
    } else {
      user.lastLogin = Date.now();
      await user.save();
      const token = await jwt.sign(
        {
          name: user.name,
          username: user.username,
          id: user.id,
          role: user.role,
          gender: user.gender,
          email: user.email,
          avatar: user.avatar,
          lastLogin: user.lastLogin,
        },
        Secret_Key,
        { expiresIn: "1h" }
      );
      res.status(201).json({ message: `Welcome ${user.name}`, data: token });
    }
  } catch (error) {
    res.status(200).json({ error: "Unexpected Error Occurred" });
    next(`ERROR IN: login function => ${error}`);
  }
};

module.exports.logout = async (req, res, next) => {
  try {
    res.status(201).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(200).json({ error: "Unexpected Error Occurred" });
    next(`ERROR IN: Logout Function => ${err}`);
  }
};

module.exports.register = async (req, res, next) => {
  //userId is the admin id
  try {
    const { name, gender, email, username, password, role, userId } = req.body;
    const id = uuidv4();
    const validEmail = emailAcceptance(email);
    const validPassword = passwordAcceptance(password);
    const { isValid: validUsername, error: usernameError } = usernameAcceptance(username);
    let isAdmin = false;

    if (req.headers["authorization"]) {
        try {
            const token = req.headers["authorization"];
            const decoded = jwt.verify(token, Secret_Key);
            isAdmin = decoded.role === "admin";
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                next(`ERROR IN: register function => ${error}`);
                return res.status(200).json({error: "Session Expired, please login again"});
            } else {
                next(`ERROR IN: register function => ${error}`);
                return res.status(200).json({error: "Invalid credentials"});
            }
        }
    }

    if (!validEmail || (!isAdmin && !validPassword)) {
      return res.status(200).json({ error: "Invalid email or password" });
    }

    if (!validUsername) {
      return res.status(200).json({ error: usernameError });
    }

    if (await User.findOne({ username: username })) {
      return res.status(200).json({ error: "Username already exists" });
    }

    if (await User.findOne({ email: email })) {
      return res.status(200).json({ error: "Email already exists" });
    }

    if (!role) {
        return res.status(200).json({ error: "Role is required" });
    }

    if (!["user", "manager", "admin"].includes(role.toLowerCase())) {
        return res.status(200).json({ error: "Invalid role" });
    }

    if (userId) {
      // Prevent admin from adding another admin
      const admin = await User.findOne({ role: "admin", id: userId });
      if (admin && role === "admin") {
        return res.status(200).json({ error: "Unauthorized action" });
      }

      if (!userId && role.toLowerCase() === "admin") {
        return res.status(200).json({ error: "Unauthorized action" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      id,
      gender,
      email,
      username,
      password: hashedPassword,
      role,
      avatar: gender === "Male"?
          `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 50) + 1}`
      :
          `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 50) + 51}`
    });
    await user.save();
    role.toLowerCase() === "Manager"?
        res.status(201).json({ message: `Manager (${user.name}) Added Successfully` })
    :
        res.status(201).json({ message: `User (${user.name}) registered successfully` })
  } catch (error) {
    res.status(200).json({ error: "Unexpected Error Occurred" });
    next(`ERROR IN: Register function => ${error}`);
  }
};

module.exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, isedit } = req.body;
    let { theme } = req.body;
    theme = theme === "dark" ? "dark" : "light"; // Default to light if not provided
    const token = req.headers["authorization"];

    if (isedit) {
      if (!token) {
        return res.status(200).json({ error: "You Must Be Logged In" });
      }
      try {
        jwt.verify(token, Secret_Key); // change decode to authorization
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          res.status(200).json({ error: "Session Expired, please login again" });
        } else {
          res.status(200).json({ error: "Invalid credentials" });
        }
        next(`ERROR IN: VerifyTokenForUser function => ${error}`);
      }
    }

    // check if user exit
    const user = await User.findOne({ email });
    if (!user) {
      //console.log("User not found for email:", email);
      return res.status(200).json({ error: "User not found" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set the token expiry time (e.g., 1 hour from now)
    const tokenExpiry = Date.now() + (1000 * 60 * 10); // 10 minutes

    // Save the token and expiry to the user record (you might need to modify your User model)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await user.save();
    //console.log("User saved with reset token:", resetToken);

    // Construct the password reset URL
    const resetUrl = `http://localhost:5173/resetPassword/${resetToken}`;

    if (isedit) {
        return res.status(201).json({ data: { resetToken } });
    }

    const emailTemplate = `
      <div style="background-color: ${theme === "dark" ? "#1a1a1a" : "#ffffff"}; color: ${theme === "dark" ? "#f5f5f5" : "#333333"}; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: ${theme === "dark" ? "#ffffff" : "#000000"};">Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) have requested to reset your password.</p>
        <p>Please click the button below to complete the process:</p>
        <div style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: ${theme === "dark" ? "#444" : "#007bff"}; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If you did not request this, please ignore this email. Your password will remain unchanged.</p>
        <p style="margin-top: 20px; font-size: 12px; color: ${theme === "dark" ? "#bbb" : "#666"};">This link will expire in 10 minutes.</p>
      </div>
    `;

    // Send the password reset email
    const mailOptions = {
      from: Email,
      to: user.email,
      subject: "Password Reset Request",
      html: emailTemplate, // Use HTML instead of plain text
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Password reset link sent successfully" });
  } catch (error) {
    res.status(200).json({ error: "Unexpected Error Occurred" });
    next(`ERROR IN: forgotPassword function => ${error}`);
  }
};

module.exports.verifyResetToken = async (req, res, next) => {
    try {
        const { token } = req.params;

        if (token && token.toLowerCase() === "null") {
            return res.status(200).json({ error: "Password reset token is required" });
        }

        const user =
            await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

        const userResetToken =
            await User.findOne({resetPasswordToken: token});

        if ( userResetToken && Date.now() > userResetToken.resetPasswordExpires ) {
          return res.status(200).json({ error: "Password reset token has expired" });
        }
        if (!user) {
            return res.status(200).json({ error: "Password reset token is invalid" });
        } else {
            res.status(201).json({ message: "Password reset token is valid" });
        }
    } catch (error) {
      res.status(200).json({ error: "Unexpected Error Occurred" });
      next(`ERROR IN: verifyResetToken function => ${error}`);
    }
}

module.exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { oldpassword, password, mode } = req.body;

    // Find the user by the reset token and ensure the token hasn't expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Check if the token hasn't expired
    });

    if (!user) {
      return res
        .status(200)
        .json({ error: "Password reset token is invalid or has expired" });
    }

    if (mode === "ChangePassword") { // Validate the old password ONLY
        const isValidOldPassword = await bcrypt.compare(oldpassword, user.password);
        if (!isValidOldPassword) {
          return res.status(200).json({error: "Invalid old password provided"});
        }
    }

    // Hash the new password
    const isValid = passwordAcceptance(password);
    if (!isValid) {
      return res.status(200).json({ error: "Invalid password" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and clear the reset token and expiry
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(201).json({ message: "Password has been reset successfully" });
  } catch (error) {
    res.status(200).json({ error: "Unexpected Error Occurred" });
    next(`ERROR IN: resetPassword function => ${error}`);
  }
};

module.exports.getUser = async (req, res, next) => {
  try {
    const { id } = req.params; // Use req.params instead of req.body
    const user = await User.findOne({ id });

    if (!user) {
      return res.status(404).json({ error: "User not found" }); // Use 404 status for not found
    }
    res.status(200).json({ data: user }); // Use 200 status for successful retrieval
  } catch (error) {
    res.status(500).json({ error: "Unexpected Error Occurred" }); // Use 500 status for server error
    next(`ERROR IN: getUser function => ${error}`);
  }
};

// Get all users with pagination
module.exports.getUsers = async (req, res, next) => {
    try {
        let { page = 1, limit = 5, search = null, role = null } = req.query;
        page = parseInt(page); limit = parseInt(limit);
        let query = {};
        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: "i" } },
                    { email: { $regex: search, $options: "i" } },
                    { username: { $regex: search, $options: "i" } },
                ],
            };
        }
        if (role) {
            query.role = role;
        }
        const users = await User.find(query).select("-_id -password -resetPasswordToken -resetPasswordExpires")
        .limit(limit)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.find(query).countDocuments();

        res.status(201).json({
          data: {
            users,
            totalDocs: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
          }
        });
    } catch (error) {
        res.status(200).json({ error: "Unexpected Error Occurred" }); // Use 500 status for server error
        next(`ERROR IN: getUsers function => ${error}`);
    }
}

module.exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndDelete({ id: id });

    if (!user) {
      return res.status(200).json({ message: "User not found" });
    }
    res.status(201)
        .json({ message: `User (${user.name}) deleted successfully` });
  } catch (error) {
    res.status(200).json({ error: "Unexpected Error Occurred" }); // Use 500 status for server error
    next(`ERROR IN: deleteUser function => ${error}`);
  }
};

module.exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sentUser = req.body;
    let user = await User.findOne({ id }).select("-resetPasswordToken -resetPasswordExpires");
    if (!user) {
      return res.status(200).json({ error: "User not found" });
    }

    const checkUsername = await User.findOne({ username: sentUser.username });
    if (checkUsername && checkUsername.id !== id) {
      return res.status(200).json({ error: "Username already exists" });
    }

    const checkEmail =
        await User.findOne({ email: sentUser.email });
    if (checkEmail && checkEmail.id !== id) {
      return res.status(200).json({ error: "Email already exists" });
    }

    user.name = sentUser.name;
    user.email = sentUser.email;
    user.username = sentUser.username;
    user.gender = sentUser.gender;
    user.avatar = sentUser.avatar;

    if (req.role === "admin" && sentUser.role !== "admin") {
        user.role = sentUser.role;
    }

    if (sentUser.password) {
        const isValid = passwordAcceptance(sentUser.password);
        if (!isValid) {
            return res.status(200).json({ error: "Invalid password" });
        }
        user.password = await bcrypt.hash(sentUser.password, 10);
    }

    user.updatedAt = Date.now();

    await user.save();

    if (!sentUser.password) {
        user = user.toObject();
        delete user.password;
        delete user._id;
    }

    const token = await jwt.sign(
        {
          name: user.name,
          username: user.username,
          email: user.email,
          id: user.id,
          role: user.role,
          gender: user.gender,
          avatar: user.avatar,
        },
        Secret_Key,
        { expiresIn: "1h" }
    );
    console.log(user)

    res.status(201).json({
      message: `User (${user.name}) updated successfully`,
      data: {user, token}
    });
  } catch (error) {
    res.status(200).json({ error: "Unexpected Error Occurred" });
    next(`ERROR IN: updateUser function => ${error}`);
  }
};

// Contact Us Form
module.exports.contactUs = async (req, res, next) => {
  try {
    let { name, email, message, theme } = req.body;
    theme = theme === "dark" ? "dark" : "light"; // Default to light if not provided

    if (!name || !email || !message) {
      return res.status(200).json({ error: "All fields are required" });
    }

    // Check for injection attempts
    if (isInjectionAttempt(message)) {
      return res.status(200).json({ error: "Suspicious input detected!" });
    }

    // Sanitize message to remove dangerous elements
    message = sanitizeMessage(message);

    // Email to Admin
    const adminMailOptions = {
      from: `"Task Management System" <${Email}>`,
      to: Email, // Admin Email
      subject: "New Contact Us Form Submission",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: ${theme === "dark" ? "#222" : "#fff"}; color: ${theme === "dark" ? "#f1f1f1" : "#333"};">
          <h2 style="color: ${theme === "dark" ? "#17a2b8" : "#007bff"};">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong> ${message}</p>
          <hr style="border-color: ${theme === "dark" ? "#444" : "#ccc"};" />
          <p style="font-size: 12px; color: ${theme === "dark" ? "#bbb" : "gray"};">This message was received from the Contact Us form on your website.</p>
        </div>
      `,
    };

    // Email to User (Acknowledgment)
    const userMailOptions = {
      from: `"Task Management Team" <${Email}>`,
      to: email, // User Email
      subject: "We Received Your Message - Task Management",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: ${theme === "dark" ? "#222" : "#fff"}; color: ${theme === "dark" ? "#f1f1f1" : "#333"};">
          <h2 style="color: ${theme === "dark" ? "#28a745" : "#007bff"};">Thank You for Contacting Us, ${name}!</h2>
          <p>We have received your message and our team will get back to you as soon as possible.</p>
          <p><strong>Your Message:</strong></p>
          <blockquote style="border-left: 4px solid ${theme === "dark" ? "#17a2b8" : "#007bff"}; padding-left: 10px; color: ${theme === "dark" ? "#ccc" : "#555"};">
            ${message}
          </blockquote>
          <p>We appreciate your time and will contact you soon.</p>
          <p style="font-size: 12px; color: ${theme === "dark" ? "#bbb" : "gray"};">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    // Send emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    res.status(201).json({ message: "Message sent successfully" });
  } catch (error) {
    res.status(200).json({ error: "Unexpected Error Occurred" });
    next(`ERROR IN: contactUs function => ${error}`);
  }
};
