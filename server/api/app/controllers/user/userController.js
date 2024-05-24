const _ = require("lodash");
const supabase = require("../../services/supabase");
const { jwtDecode } = require("jwt-decode");

const userController = {
  verifyUser: async (req, res) => {
    try {
      const supabaseClient = new supabase({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
      });
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ message: "Access token is required!" });
      }
      const decoded = jwtDecode(accessToken);
      let { data, error } = await supabaseClient.from("users").select("*").eq("email", decoded.email).eq("provider", decoded.app_metadata.provider);
      if (error){
        throw new Error(error?.message);
      }
      if (!data || data.length === 0) {
        if (decoded?.app_metadata?.provider) {
            const {  error } = await supabaseClient.from("users").insert({
                email: decoded.email,
                provider: decoded.app_metadata.provider,
                logged_in: true,
                session_id: decoded.session_id,
                img_url: decoded.user_metadata.avatar_url,
                full_name: decoded.user_metadata.full_name
            });
            if (error) {
                throw new Error(error?.message);
            }
            const response = await supabaseClient.from("users").select("*").eq("email", decoded.email).eq("provider", decoded.app_metadata.provider);
            data = response.data;
        }
      } else {
        let { data, error} = await supabaseClient.from("users").update({session_id: decoded.session_id, logged_in: true}).eq("email", decoded.email).eq("provider", decoded.app_metadata.provider);
        if (error) {
          throw new Error(error?.message);
        }
      }
      res.status(200).json({ message: "User verified successfully!", data });
    } catch (error) {
        console.log(error);
      return res.status(500).json({ message: "Something went wrong when verifying user!", error});
    }
  },

  signup: async (req, res) => {
    try {
      const supabaseClient = new supabase({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
      });
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required!" });
      }
      const alreadyExistingData = await supabaseClient.from("users").select("*").eq("email", email).is("session_id", null);
      if (alreadyExistingData.error) {
        throw new Error(alreadyExistingData.error?.message);
      }
      if (alreadyExistingData.data && alreadyExistingData.data.length > 0) {
        return res.status(400).json({ error: "User already exists!" });
      }
      const { error } = await supabaseClient.from("users").insert({
        email,
        password,
        logged_in: true,
      });
      const { data } = await supabaseClient.from("users").select("*").eq("email", email).is("session_id", null);
      console.log(data);
      if (error) {
        throw new Error(error?.message);
      }
      res.status(200).json({ message: "User created successfully!", data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong when creating user!", error });
    }
  },

  updateUser: async (req, res) => {
    try {
      const supabaseClient = new supabase({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
      });
      const { firstName, lastName, accessToken } = req.body;
      if (!firstName || !lastName || !accessToken) {
        return res.status(400).json({ message: "First Name and Last Name are required!" });
      }
      const email = accessToken.email;
      const { error } = await supabaseClient.from("users").update({full_name: firstName + " " + lastName, img_url: `https://ui-avatars.com/api/?name=${firstName}+${lastName}`}).eq("email", email).is("session_id", null);
      if (error) {
        throw new Error(error?.message);
      }
      const { data } = await supabaseClient.from("users").select("*").eq("email", email).is("session_id", null);
      res.status(200).json({ message: "User updated successfully!", data});
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong when updating user!", error });
    }
  },

  logout: async (req, res) => {
    try {
      const supabaseClient = new supabase({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
      });
      const { accessToken } = req.body;
      if (!accessToken) {
        return res.status(400).json({ message: "Access token is required!" });
      }
      if (!accessToken.email) {
        return res.status(400).json({ message: "Email is required!" });
      }
      if (accessToken.provider) {
        let { data, error } = await supabaseClient.from("users").update({logged_in: false}).eq("email", accessToken.email).eq("provider", accessToken.provider);
        if (error) {
          throw new Error(error?.message);
        }
        return res.status(200).json({ message: "User logged out successfully!", data });
      }
      let { data, error } = await supabaseClient.from("users").update({logged_in: false}).eq("email", accessToken.email).is("session_id", null);
      if (error) {
        throw new Error(error?.message);
      }
      res.status(200).json({ message: "User logged out successfully!", data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong when logging out user!", error });
    }
  },

  login: async (req, res) => {
    try {
      const supabaseClient = new supabase({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
      });
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required!" });
      }
      if (!password) {
        return res.status(400).json({ message: "Password is required!" });
      }
      let { data, error } = await supabaseClient.from("users").select("*").eq("email", email).eq("password", password);
      if (error) {
        throw new Error(error?.message);
      }
      if (!data || data.length === 0) {
        throw new Error("User Does not Exist");
      }
      return res.status(200).json({ message: "User logged in successfully!", data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong when logging in user!", error });
    }
  },

  toggleDarkMode: async (req, res) => {
    try {
      const supabaseClient = new supabase({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
      });
      const { accessToken, toggle } = req.body;
      if (!accessToken) {
        return res.status(400).json({ message: "Access token is required!" });
      }
      const userId = accessToken.id;
      console.log(accessToken)
      let { error } = await supabaseClient.from("users").update({dark_mode: toggle}).eq("id", userId);
      if (error) {
        console.log(error.message);
        throw new Error(error?.message);
      };
      const { data } = await supabaseClient.from("users").select("*").eq("id", userId);
      res.status(200).json({ message: "Dark mode toggled successfully!", data });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Something went wrong when toggling dark mode!", error });
    }
  },
};

module.exports = userController;
