const Front_Port = 5173;
const Back_Port = 3008;
const Front_Origin = `https://task-management-system-uwpq.vercel.app`;
const Back_Origin = `https://task-management-system-rouge-omega.vercel.app`;
const Secret_Key = 'a7c11385e00dae315afbe1cfb38a05b19b808715dee90a37088b0d7dd4ee357';
// Database_URI format: "mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority&appName=<appname>"
const Database_URI = "mongodb+srv://omaralaa927:MNEhhVfKUb8iifTe@cluster0.pv4l5.mongodb.net/Task_Management?retryWrites=true&w=majority&appName=Cluster0";

function convertStringToType(value) {
    if (value === undefined || value === null || value === true || value === false) {
        return value;
    }
    if (value === "undefined") {
        return undefined;
    }
    if (value === "null") {
        return null;
    }
    if (value === "true") {
        return true;
    }
    if (value === "false") {
        return false;
    }
    if (!isNaN(value) && value.trim() !== "") {
        return Number(value); // Convert numeric strings to numbers
    }
    return value; // Return as-is for other strings
}

// nodemiler configuration
const Email = "noreplyojo@gmail.com";
const EMAIL_PASSWORD = "emioxrfshxsnevbq";

// To use environment variables in the backend, you can use the following code:
// process.env.TEST = "test";

module.exports = {
    Front_Port,
    Back_Port,
    Front_Origin,
    Back_Origin,
    Database_URI,
    Secret_Key,
    convertStringToType,
    Email,
    EMAIL_PASSWORD
}