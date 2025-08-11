// Gonna house all the api calls here, otherwise we'll have to do it for every page
// If we forget to do a fetch with credentials once in any of the pages, the cookies'll break
// Easier to just import this file
import axios from "axios";

// Remove trailing slash if present
const baseURL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

export const api = axios.create({
  baseURL: baseURL || undefined, // CRA dev can use proxy if no baseURL is set
  withCredentials: true,         // Send cookies with every request
});
