const { Secret_Key } = require("../../env");
const jwt = require("jsonwebtoken");

// Middle ware to verify person if it is authorized or not to join route
const VerifyTokenForAdmin = async (req, res, next) => {
  const authorization = req.headers["authorization"];

  if (!authorization) {
    res.status(200).json({ error: "You must login first" });
    next("ERROR IN: VerifyTokenForAdmin function => Token is required");
    return;
  }

  try {
    let decoded = jwt.verify(authorization, Secret_Key); // change decode to authorization
    decoded.role = decoded.role.toLowerCase();
    if (decoded.role === "admin") {
      req.user = decoded;
      next();
    } else {
      res.status(200).json({ error: "You are not authorized" });
      next("ERROR IN: VerifyTokenForAdmin function => Invalid role");
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(200).json({ error: "Session Expired, please login again" });
    } else {
      res.status(200).json({ error: "Invalid credentials" });
    }
    next(`ERROR IN: VerifyTokenForAdmin function => ${error}`);
  }
};

const VerifyTokenForManager = async (req, res, next) => {
  const authorization = req.headers["authorization"];

  if (!authorization) {
    res.status(200).json({ error: "You must login first" });
    next("ERROR IN: VerifyTokenForManager function => Token is required");
    return;
  }

  try {
    let decoded = jwt.verify(authorization, Secret_Key); // change decode to authorization
    decoded.role = decoded.role.toLowerCase();
    if (decoded.role === "manager" || decoded.role === "admin") {
      req.user = decoded;
      next();
    } else {
      res.status(200).json({ error: "You are not authorized" });
      next("ERROR IN: VerifyTokenForManager function => Invalid role");
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(200).json({ error: "Session Expired, please login again" });
    } else {
      res.status(200).json({ error: "Invalid credentials" });
    }
    next(`ERROR IN: VerifyTokenForManager function => ${error}`);
  }
};

const VerifyTokenForUser = async (req, res, next) => {
  const authorization = req.headers["authorization"];

  if (!authorization) {
    res.status(200).json({ error: "You must login first" });
    next("ERROR IN: VerifyTokenForUser function => Token is required");
    return;
  }

  try {
    let decoded = jwt.verify(authorization, Secret_Key); // change decode to authorization
    decoded.role = decoded.role.toLowerCase();
    if (decoded.role === "user" || decoded.role === "manager" || decoded.role === "admin") {
      req.user = decoded;
      next();
    } else {
      res.status(200).json({ error: "You are not authorized" });
      next("ERROR IN: VerifyTokenForUser function => Invalid role");
    }
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(200).json({ error: "Session Expired, please login again" });
    } else {
      res.status(200).json({ error: "Invalid credentials" });
    }
    next(`ERROR IN: VerifyTokenForUser function => ${error}`);
  }
};

function verifyToken (role) {
  if (!role) {
    return VerifyTokenForUser;
  }
  role = role.toLowerCase().replaceAll(" ", "");
  if (role === "admin") {
    return VerifyTokenForAdmin;
  } else if (role === "manager") {
    return VerifyTokenForManager;
  } else {
    return VerifyTokenForUser;
  }
}

module.exports = verifyToken;
