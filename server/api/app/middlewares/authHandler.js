const _ = require("lodash");
const jwt = require("jsonwebtoken");
const supabase = require("../services/supabase");

const authHandler = async(req, res, next) => {
  const accessToken = req.body.accessToken;
  if (!accessToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const supabaseClient = new supabase({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY
    });
    if (accessToken.provider) {
      let { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("email", accessToken.email)
        .eq("provider", accessToken.provider)
        .eq("session_id", accessToken.session_id);
      if (error) {
        throw new Error(error?.message);
      }
      if (!data || data.length === 0) {
        throw new Error("User does not exist");
      }
      req.user = data[0];
      next();
    } else {
      let { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .eq("email", accessToken.email)
        .eq("password", accessToken.password)
        .is("session_id", null);
      if (error) {
        console.log(error);
        throw new Error(error?.message);
      }
      if (!data || data.length === 0) {
        throw new Error("User does not exist");
      }
      req.user = data[0];
      next();
    }
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = authHandler;
